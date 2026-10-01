import { COMMAND_CONVERT_SELECTION } from '@/constants/config';
import { deliverToTab } from './tab-bridge';

/** Keyboard shortcut (default Alt+Shift+C, remappable at chrome://extensions/shortcuts). */
export function registerCommandHandler(): void {
  chrome.commands.onCommand.addListener((command, tab) => {
    if (command !== COMMAND_CONVERT_SELECTION || tab?.id === undefined) return;
    // No frame id: every frame receives it and only the one holding the selection responds.
    void deliverToTab(tab.id, { type: 'currio/convert-selection', trigger: 'shortcut' });
  });
}
