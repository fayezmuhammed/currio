/**
 * Content-script controller. Listens for selections (never scans the page),
 * parses them locally and asks the background service worker to convert.
 *
 * Only the parsed number and currency code are sent to the service worker;
 * selected text never leaves this script.
 */
import { DEFAULT_SETTINGS, LOADING_STATE_DELAY_MS } from '@/constants/config';
import { CURRENCIES } from '@/constants/currencies';
import { isContextInvalidated, isCurrioMessage, sendToBackground } from '@/platform/messaging';
import { onStorageKeyChanged } from '@/platform/storage';
import { SETTINGS_KEY, sanitizeSettings } from '@/services/settings-service';
import type { CurrencyCode, ParsedAmount } from '@/types/currency';
import type { Conversion, RateErrorCode } from '@/types/exchange-rate';
import type { ConversionTrigger, Result } from '@/types/messages';
import type { Settings } from '@/types/settings';
import type { Rect } from '@/utils/positioning';
import { parseCurrency } from './currency-parser';
import { FloatingCard, type CardState } from './floating-ui';
import { detectTheme, getPageHints } from './page-context';
import { pointRect, readSelection } from './selection';

/**
 * Dispatched before a fresh copy of the content script starts (after an
 * extension update or re-injection) so the previous copy cleans up.
 */
export const TEARDOWN_EVENT = 'currio:teardown';

const KEY_SELECTION_DEBOUNCE_MS = 250;
const SELECTION_KEYS = new Set(['Shift', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'a', 'A']);

const ERROR_MESSAGES: Record<RateErrorCode, string> = {
  'network-unavailable': "You're offline and no rates are cached yet.",
  'provider-error': "Couldn't reach the rate service. Try again in a moment.",
  'rate-unavailable': 'No rate available for this currency right now.',
  'unsupported-currency': "Currio doesn't support this currency yet.",
  'invalid-amount': "That amount doesn't look right.",
};

export interface CurrioController {
  destroy(): void;
}

export function startCurrio(): CurrioController {
  let settings: Settings = { ...DEFAULT_SETTINGS };
  let requestId = 0;
  let current: { text: string; parsed: ParsedAmount; anchor: () => Rect | null } | null = null;
  let keyTimer: ReturnType<typeof setTimeout> | undefined;
  let lastContextPoint: Rect | null = null;
  let destroyed = false;

  const card = new FloatingCard({
    onDismiss: () => {
      current = null;
      requestId++;
      document.removeEventListener('selectionchange', onSelectionChange);
    },
    onChangeCurrency: (currency) => {
      if (!current) return;
      const previous = current.parsed;
      const parsed: ParsedAmount = {
        ...previous,
        currency,
        alternatives: [previous.currency, ...previous.alternatives.filter((c) => c !== currency)],
      };
      current = { ...current, parsed };
      void convert(parsed, current.anchor, null);
    },
  });

  // ── Settings ──────────────────────────────────────────────────────────────

  void chrome.storage.sync
    .get(SETTINGS_KEY)
    .then((stored) => {
      settings = sanitizeSettings(stored[SETTINGS_KEY]);
    })
    .catch(() => undefined);
  const unwatchSettings = onStorageKeyChanged('sync', SETTINGS_KEY, (value) => {
    settings = sanitizeSettings(value);
    if (card.isOpen) closeCard();
  });

  // ── Triggers ──────────────────────────────────────────────────────────────

  function handleSelection(trigger: ConversionTrigger, fallbackText?: string): void {
    if (destroyed) return;
    if (isContextInvalidated()) {
      destroy();
      return;
    }
    const explicit = trigger !== 'selection';
    if (!explicit && !settings.autoConvert) return;

    const selection = readSelection();
    if (!explicit && (!selection || selection.editable)) return;

    // Context menu: prefer the live selection, else what Chrome reported.
    const text = selection?.text ?? fallbackText;
    const anchor = selection?.getRect ?? fallbackAnchor();
    const theme = detectTheme(selection?.element ?? document.querySelector('body'));

    if (!text) {
      // The shortcut reaches every frame; only the focused one should speak up.
      if (trigger === 'shortcut' && document.hasFocus()) {
        showNotice(anchor, theme, 'Select a price on the page, then press the shortcut again.');
      }
      return;
    }
    if (current && current.text === text && card.isOpen) return;

    const parsed = parseCurrency(text, getPageHints());
    if (!parsed) {
      if (explicit) showNotice(anchor, theme, "Currio couldn't find a price in that selection.");
      else if (card.isOpen) closeCard();
      return;
    }
    if (parsed.currency === settings.preferredCurrency) {
      if (explicit) showNotice(anchor, theme, `That's already in ${CURRENCIES[parsed.currency].name}.`);
      else if (card.isOpen) closeCard();
      return;
    }

    current = { text, parsed, anchor };
    void convert(parsed, anchor, theme);
  }

  /** `theme` null = keep the open card and just update its contents. */
  async function convert(parsed: ParsedAmount, anchor: () => Rect | null, theme: ReturnType<typeof detectTheme> | null): Promise<void> {
    const id = ++requestId;
    const to = settings.preferredCurrency;
    const pending = requestConversion(parsed, to);

    // Cached rates answer in a few ms: skip the loading state to avoid a flash.
    const early = await Promise.race([pending, delay(LOADING_STATE_DELAY_MS).then(() => null)]);
    if (id !== requestId) return;
    if (!early) render({ kind: 'loading', parsed, to }, anchor, theme);

    const response = early ?? (await pending);
    if (id !== requestId || !response) return;
    render(toCardState(parsed, response), anchor, early ? theme : null);
  }

  function render(state: CardState, anchor: () => Rect | null, theme: ReturnType<typeof detectTheme> | null): void {
    if (theme && !card.isOpen) {
      card.show(anchor, theme, state);
      document.addEventListener('selectionchange', onSelectionChange);
    } else if (theme) {
      card.show(anchor, theme, state);
    } else {
      card.update(state);
    }
  }

  function toCardState(parsed: ParsedAmount, response: Result<Conversion>): CardState {
    if (response.ok) return { kind: 'result', parsed, conversion: response.value, showRateInfo: settings.showRateInfo };
    return { kind: 'error', parsed, message: ERROR_MESSAGES[response.error] };
  }

  async function requestConversion(parsed: ParsedAmount, to: CurrencyCode): Promise<Result<Conversion> | null> {
    try {
      return await sendToBackground({ type: 'currio/convert', amount: parsed.amount, from: parsed.currency, to });
    } catch {
      if (isContextInvalidated()) destroy();
      return { ok: false, error: 'provider-error' };
    }
  }

  function showNotice(anchor: () => Rect | null, theme: ReturnType<typeof detectTheme>, message: string): void {
    current = null;
    requestId++;
    card.show(anchor, theme, { kind: 'notice', message });
    document.addEventListener('selectionchange', onSelectionChange);
  }

  function closeCard(): void {
    card.hide();
    current = null;
    requestId++;
    document.removeEventListener('selectionchange', onSelectionChange);
  }

  function fallbackAnchor(): () => Rect {
    const point = lastContextPoint ?? pointRect(window.innerWidth / 2, 24);
    return () => point;
  }

  // ── DOM listeners (a handful, all passive) ───────────────────────────────

  function onMouseUp(event: MouseEvent): void {
    if (event.button !== 0 || card.contains(event)) return;
    // Let the browser finish updating the selection (double/triple click).
    setTimeout(() => handleSelection('selection'), 0);
  }

  function onKeyUp(event: KeyboardEvent): void {
    if (!SELECTION_KEYS.has(event.key) || !(event.shiftKey || event.key === 'Shift' || event.metaKey || event.ctrlKey)) return;
    clearTimeout(keyTimer);
    keyTimer = setTimeout(() => handleSelection('selection'), KEY_SELECTION_DEBOUNCE_MS);
  }

  function onContextMenu(event: MouseEvent): void {
    lastContextPoint = pointRect(event.clientX, event.clientY);
  }

  /** Close the card once the selection is cleared. Attached only while the card is open. */
  function onSelectionChange(): void {
    if (!current) return;
    const selection = window.getSelection();
    const active = document.activeElement;
    const inputSelection =
      (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) &&
      active.selectionStart !== active.selectionEnd;
    if ((!selection || selection.isCollapsed) && !inputSelection) closeCard();
  }

  function onMessage(message: unknown, sender: chrome.runtime.MessageSender): false {
    if (sender.id !== chrome.runtime.id || !isCurrioMessage(message)) return false;
    if (message.type === 'currio/convert-selection') handleSelection(message.trigger, message.text);
    return false;
  }

  function onTeardown(): void {
    destroy();
  }

  document.addEventListener('mouseup', onMouseUp, { capture: true, passive: true });
  document.addEventListener('keyup', onKeyUp, { capture: true, passive: true });
  document.addEventListener('contextmenu', onContextMenu, { capture: true, passive: true });
  document.addEventListener(TEARDOWN_EVENT, onTeardown);
  chrome.runtime.onMessage.addListener(onMessage);

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    card.hide();
    clearTimeout(keyTimer);
    document.removeEventListener('mouseup', onMouseUp, { capture: true });
    document.removeEventListener('keyup', onKeyUp, { capture: true });
    document.removeEventListener('contextmenu', onContextMenu, { capture: true });
    document.removeEventListener('selectionchange', onSelectionChange);
    document.removeEventListener(TEARDOWN_EVENT, onTeardown);
    try {
      chrome.runtime.onMessage.removeListener(onMessage);
      unwatchSettings();
    } catch {
      // Context already invalidated.
    }
  }

  return { destroy };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
