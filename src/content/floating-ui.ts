/**
 * The floating conversion card. Rendered in a closed shadow root attached to
 * a single host element, which is removed again when the card closes, so the
 * page is never permanently modified.
 */
import { CURRENCIES } from '@/constants/currencies';
import type { CurrencyCode, ParsedAmount } from '@/types/currency';
import type { Conversion } from '@/types/exchange-rate';
import {
  displayFractionDigits,
  formatMoney,
  formatRate,
  formatRelativeTime,
} from '@/utils/formatting';
import { supportsFlagEmoji } from '@/utils/platform';
import { computeCardPosition, isOutOfView, type Placement, type Rect } from '@/utils/positioning';
import { CARD_CSS } from './card-styles';
import { ICONS, brandMark, h, svgIcon } from './dom';
import type { CardTheme } from './page-context';

export type CardState =
  | { kind: 'loading'; parsed: ParsedAmount; to: CurrencyCode }
  | { kind: 'result'; parsed: ParsedAmount; conversion: Conversion; showRateInfo: boolean }
  | { kind: 'error'; parsed: ParsedAmount; message: string }
  | { kind: 'notice'; message: string };

export interface CardCallbacks {
  /** The user picked another reading of an ambiguous symbol ("$" → CAD). */
  onChangeCurrency: (currency: CurrencyCode) => void;
  /** The card closed itself (outside click, Escape, anchor scrolled away). */
  onDismiss: () => void;
}

const HOST_TAG = 'currio-card';
const EXIT_MS = 120;

const HOST_STYLES: Readonly<Record<string, string>> = {
  all: 'initial',
  position: 'fixed',
  top: '0',
  left: '0',
  width: '0',
  height: '0',
  margin: '0',
  padding: '0',
  border: '0',
  overflow: 'visible',
  'z-index': '2147483647',
  'pointer-events': 'none',
  display: 'block',
  transform: 'none',
};

let sharedSheet: CSSStyleSheet | null = null;

export class FloatingCard {
  private host: HTMLElement | null = null;
  private card: HTMLDivElement | null = null;
  private anchor: () => Rect | null = () => null;
  private placement: Placement | undefined;
  private state: CardState | null = null;
  private alternativesOpen = false;
  private frame = 0;
  private removeTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly callbacks: CardCallbacks;

  constructor(callbacks: CardCallbacks) {
    this.callbacks = callbacks;
  }

  get isOpen(): boolean {
    return this.state !== null;
  }

  show(anchor: () => Rect | null, theme: CardTheme, state: CardState): void {
    this.anchor = anchor;
    this.placement = undefined;
    this.alternativesOpen = false;
    this.ensureMounted();
    if (!this.card) return;
    this.card.dataset.theme = theme;
    this.card.dataset.visible = 'false';
    this.render(state);
    // Next frame: start the enter transition from the measured position.
    requestAnimationFrame(() => {
      if (this.card && this.state) this.card.dataset.visible = 'true';
    });
  }

  update(state: CardState): void {
    if (!this.card) return;
    this.render(state);
  }

  /** Close the card and remove every trace of it from the page. */
  hide(): void {
    if (!this.host) return;
    this.state = null;
    this.detachListeners();
    const host = this.host;
    const card = this.card;
    this.host = null;
    this.card = null;
    if (card) card.dataset.visible = 'false';
    clearTimeout(this.removeTimer);
    this.removeTimer = setTimeout(() => host.remove(), EXIT_MS);
  }

  /** True when an event originated inside the card. */
  contains(event: Event): boolean {
    return this.host !== null && event.composedPath().includes(this.host);
  }

  // ── Mounting ──────────────────────────────────────────────────────────────

  private ensureMounted(): void {
    if (this.host?.isConnected) return;
    const host = document.createElement(HOST_TAG);
    for (const [prop, value] of Object.entries(HOST_STYLES)) host.style.setProperty(prop, value, 'important');
    const root = host.attachShadow({ mode: 'closed' });
    applyStyles(root);

    const card = h('div', { class: 'card', attrs: { role: 'status', 'aria-live': 'polite', 'aria-label': 'Currio conversion' } });
    card.style.pointerEvents = 'auto';
    // Keep the page's selection intact and keep our clicks away from page handlers.
    card.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    for (const type of ['mouseup', 'click', 'pointerdown', 'pointerup', 'dblclick'] as const) {
      card.addEventListener(type, (event) => event.stopPropagation());
    }
    root.append(card);

    (document.fullscreenElement ?? document.documentElement).append(host);
    this.host = host;
    this.card = card;
    this.attachListeners();
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  private render(state: CardState): void {
    const card = this.card;
    if (!card) return;
    this.state = state;
    card.replaceChildren(...this.buildContent(state));
    this.reposition();
  }

  private buildContent(state: CardState): Node[] {
    if (state.kind === 'notice') {
      return [
        h('div', { class: 'row message', attrs: { 'data-tone': 'info' } },
          brandMark(16),
          h('span', null, state.message)),
      ];
    }

    const nodes: Node[] = [this.sourceRow(state.parsed)];
    if (this.alternativesOpen && state.parsed.alternatives.length > 0) nodes.push(this.alternativesRow(state.parsed));

    if (state.kind === 'loading') {
      nodes.push(
        h('div', { class: 'row result' },
          currencyIcon(state.to),
          h('span', { class: 'approx' }, '≈'),
          h('span', { class: 'loading-text' }, 'Calculating…')),
        h('div', { class: 'shimmer', attrs: { 'aria-hidden': 'true' } }),
      );
    } else if (state.kind === 'error') {
      nodes.push(
        h('div', { class: 'row message', attrs: { 'data-tone': 'error' } },
          svgIcon(ICONS.alert, { size: 14 }),
          h('span', null, state.message)),
      );
    } else {
      nodes.push(this.resultRow(state.parsed, state.conversion));
      const meta = metaRow(state.conversion, state.showRateInfo);
      if (meta) nodes.push(meta);
    }
    return nodes;
  }

  private sourceRow(parsed: ParsedAmount): HTMLElement {
    const def = CURRENCIES[parsed.currency];
    const digits = Number.isInteger(parsed.amount) ? 0 : def.minorUnits;
    const money = formatMoney(parsed.amount, parsed.currency, { fractionDigits: digits });

    let code: HTMLElement | null = null;
    if (parsed.ambiguous && parsed.alternatives.length > 0) {
      code = h('button', {
        class: 'code-btn',
        attrs: {
          type: 'button',
          'aria-expanded': String(this.alternativesOpen),
          title: `Read as ${def.name}. Click to change.`,
        },
        on: { click: () => this.toggleAlternatives() },
      }, parsed.currency, svgIcon(ICONS.chevronDown, { size: 12 }));
    } else if (!money.symbolIsCode) {
      code = h('span', null, parsed.currency);
    }

    return h('div', { class: 'row source' },
      currencyIcon(parsed.currency),
      h('span', { class: 'source-text' }, money.text),
      code,
      h('span', { class: 'spacer' }),
      brandMark(16));
  }

  private alternativesRow(parsed: ParsedAmount): HTMLElement {
    return h('div', { class: 'row alternatives', attrs: { role: 'group', 'aria-label': 'Other currencies this symbol can mean' } },
      h('span', { class: 'alt-label' }, 'Or'),
      ...parsed.alternatives.map((code) =>
        h('button', {
          class: 'chip',
          attrs: { type: 'button', title: CURRENCIES[code].name },
          on: { click: () => {
            this.alternativesOpen = false;
            this.callbacks.onChangeCurrency(code);
          } },
        }, code)));
  }

  private resultRow(parsed: ParsedAmount, conversion: Conversion): HTMLElement {
    const digits = displayFractionDigits(parsed.amount, conversion.converted, conversion.to);
    const money = formatMoney(conversion.converted, conversion.to, { fractionDigits: digits });
    const copyButton = h('button', {
      class: 'icon-btn',
      attrs: { type: 'button', title: 'Copy', 'aria-label': `Copy ${money.text}` },
    }, svgIcon(ICONS.copy, { size: 14 }));
    copyButton.addEventListener('click', () => void copyToClipboard(money.text, copyButton));

    return h('div', { class: 'row result' },
      currencyIcon(conversion.to),
      h('span', { class: 'approx' }, '≈'),
      h('span', { class: 'value', attrs: { title: money.text } }, money.text),
      money.symbolIsCode ? null : h('span', { class: 'code' }, conversion.to),
      h('span', { class: 'spacer' }),
      copyButton);
  }

  private toggleAlternatives(): void {
    this.alternativesOpen = !this.alternativesOpen;
    if (this.state) this.render(this.state);
  }

  // ── Positioning & dismissal ───────────────────────────────────────────────

  private reposition = (): void => {
    const card = this.card;
    if (!card) return;
    const anchor = this.anchor();
    const viewport = { width: document.documentElement.clientWidth || window.innerWidth, height: window.innerHeight };
    if (!anchor || isOutOfView(anchor, viewport)) {
      if (this.state) this.dismiss();
      return;
    }
    const size = { width: card.offsetWidth, height: card.offsetHeight };
    const position = computeCardPosition(anchor, size, viewport, { preferred: this.placement });
    this.placement = position.placement;
    card.dataset.placement = position.placement;
    card.style.top = `${position.top}px`;
    card.style.left = `${position.left}px`;
  };

  private onScrollOrResize = (): void => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.reposition();
    });
  };

  private onPointerDown = (event: Event): void => {
    if (!this.contains(event)) this.dismiss();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.dismiss();
  };

  private dismiss(): void {
    this.hide();
    this.callbacks.onDismiss();
  }

  private attachListeners(): void {
    window.addEventListener('scroll', this.onScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', this.onScrollOrResize, { passive: true });
    document.addEventListener('mousedown', this.onPointerDown, true);
    document.addEventListener('keydown', this.onKeyDown, true);
  }

  private detachListeners(): void {
    window.removeEventListener('scroll', this.onScrollOrResize, { capture: true });
    window.removeEventListener('resize', this.onScrollOrResize);
    document.removeEventListener('mousedown', this.onPointerDown, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
}

function applyStyles(root: ShadowRoot): void {
  try {
    sharedSheet ??= new CSSStyleSheet();
    if (sharedSheet.cssRules.length === 0) sharedSheet.replaceSync(CARD_CSS);
    root.adoptedStyleSheets = [sharedSheet];
  } catch {
    const style = document.createElement('style');
    style.textContent = CARD_CSS;
    root.append(style);
  }
}

const FLAGS = supportsFlagEmoji();

function currencyIcon(code: CurrencyCode): HTMLElement {
  const def = CURRENCIES[code];
  if (FLAGS) return h('span', { class: 'flag', attrs: { 'aria-hidden': 'true' } }, def.flag);
  const label = Array.from(def.symbol).length <= 2 ? def.symbol : code.slice(0, 2);
  return h('span', { class: 'badge', attrs: { 'aria-hidden': 'true' } }, label);
}

/**
 * 1 AED = ₹24.12
 * Updated 2 min ago        (or "● Cached rate · updated 3 days ago" when offline)
 */
function metaRow(conversion: Conversion, showRateInfo: boolean): HTMLElement | null {
  if (!showRateInfo && !conversion.isFallback) return null;
  const updated = formatRelativeTime(conversion.providerUpdatedAt);
  const status = conversion.isFallback
    ? h('div', { class: 'row meta-line' },
        h('span', { class: 'dot', attrs: { 'aria-hidden': 'true' } }),
        h('span', { class: 'cached' }, 'Offline · cached rate'),
        h('span', null, `· ${updated}`))
    : h('div', null, `Updated ${updated}`);
  return h('div', { class: 'meta' },
    showRateInfo
      ? h('div', { class: 'meta-rate' }, `1 ${conversion.from} = ${formatRate(conversion.rate, conversion.to)}`)
      : null,
    status);
}

async function copyToClipboard(text: string, button: HTMLButtonElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    button.dataset.done = 'true';
    button.replaceChildren(svgIcon(ICONS.check, { size: 14 }));
    button.setAttribute('aria-label', 'Copied');
  } catch {
    // Clipboard blocked by the page's permissions policy; nothing else to do.
  }
}
