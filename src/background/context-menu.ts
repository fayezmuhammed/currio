import { CONTEXT_MENU_ID } from '@/constants/config';
import { deliverToTab } from './tab-bridge';

export function createContextMenu(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Convert with Currio',
      contexts: ['selection'],
    });
  });
}

export function registerContextMenuHandler(): void {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== CONTEXT_MENU_ID || tab?.id === undefined) return;
    void deliverToTab(
      tab.id,
      { type: 'currio/convert-selection', trigger: 'context-menu', text: info.selectionText },
      info.frameId,
    );
  });
}
