import { sendToTab } from '@/platform/messaging';
import type { ContentCommand } from '@/types/messages';

const CONTENT_SCRIPT = 'content.js';

/**
 * Deliver a command to a tab's content script. Tabs opened before Currio was
 * installed (or before an update) have no live content script, so inject it
 * once and retry.
 */
export async function deliverToTab(tabId: number, command: ContentCommand, frameId?: number): Promise<void> {
  try {
    await sendToTab(tabId, command, frameId);
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: frameId === undefined ? { tabId } : { tabId, frameIds: [frameId] },
        files: [CONTENT_SCRIPT],
      });
      await sendToTab(tabId, command, frameId);
    } catch {
      // Restricted page (chrome://, Web Store, PDF viewer…). Nothing to do.
    }
  }
}

/** Make Currio work in tabs that were already open when it was installed or updated. */
export async function injectIntoOpenTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }).catch(() => []);
  await Promise.allSettled(
    tabs
      .filter((tab) => tab.id !== undefined && !tab.discarded)
      .map((tab) =>
        chrome.scripting.executeScript({ target: { tabId: tab.id as number, allFrames: true }, files: [CONTENT_SCRIPT] }),
      ),
  );
}
