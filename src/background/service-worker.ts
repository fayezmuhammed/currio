/**
 * Currio background service worker. Owns all network access (exchange-rate
 * API), the rate cache, the context menu and the keyboard command. Every
 * listener is registered synchronously at top level, as MV3 requires.
 */
import { isCurrioMessage } from '@/platform/messaging';
import { onStorageKeyChanged } from '@/platform/storage';
import { SETTINGS_KEY } from '@/services/settings-service';
import { registerCommandHandler } from './commands';
import { createContextMenu, registerContextMenuHandler } from './context-menu';
import { handleRequest } from './message-router';
import { registerRateRefreshHandler, scheduleRateRefresh, warmRates } from './rate-refresh';
import { injectIntoOpenTabs } from './tab-bridge';

chrome.runtime.onInstalled.addListener((details) => {
  createContextMenu();
  void scheduleRateRefresh();
  warmRates();
  void injectIntoOpenTabs();
  if (details.reason === 'install') {
    void chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/index.html') });
  }
});

chrome.runtime.onStartup.addListener(() => {
  void scheduleRateRefresh();
  warmRates();
});

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  // Only our own extension pages and content scripts.
  if (sender.id !== chrome.runtime.id || !isCurrioMessage(message)) return false;
  if (message.type === 'currio/convert-selection') return false;
  handleRequest(message).then(sendResponse, () => sendResponse({ ok: false, error: 'provider-error' }));
  return true; // keep the channel open for the async response
});

onStorageKeyChanged('sync', SETTINGS_KEY, () => void scheduleRateRefresh());

registerContextMenuHandler();
registerCommandHandler();
registerRateRefreshHandler();
