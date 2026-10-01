import type {
  BackgroundRequest,
  BackgroundResponses,
  ContentCommand,
} from '@/types/messages';

/** Typed wrapper over chrome.runtime.sendMessage for requests to the service worker. */
export async function sendToBackground<R extends BackgroundRequest>(
  request: R,
): Promise<BackgroundResponses[R['type']]> {
  return chrome.runtime.sendMessage<R, BackgroundResponses[R['type']]>(request);
}

export async function sendToTab(tabId: number, command: ContentCommand, frameId?: number): Promise<void> {
  await chrome.tabs.sendMessage(tabId, command, frameId === undefined ? {} : { frameId });
}

const MESSAGE_TYPES: ReadonlySet<string> = new Set([
  'currio/convert',
  'currio/rate',
  'currio/rate-status',
  'currio/refresh-rates',
  'currio/convert-selection',
]);

/** Narrow an untrusted message to one of Currio's message shapes. */
export function isCurrioMessage(message: unknown): message is BackgroundRequest | ContentCommand {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof (message as { type?: unknown }).type === 'string' &&
    MESSAGE_TYPES.has((message as { type: string }).type)
  );
}

/** True when the extension was reloaded/updated and this script's context is gone. */
export function isContextInvalidated(): boolean {
  try {
    // chrome.runtime.id becomes undefined once the extension is reloaded or removed.
    const runtime = chrome.runtime as Partial<typeof chrome.runtime> | undefined;
    return !runtime?.id;
  } catch {
    return true;
  }
}
