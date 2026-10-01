import { useEffect, useState } from 'react';
import { COMMAND_CONVERT_SELECTION } from '@/constants/config';

/** The user's current shortcut for "convert selection" ('' when unassigned). */
export function useShortcut(): string | null {
  const [shortcut, setShortcut] = useState<string | null>(null);
  useEffect(() => {
    chrome.commands
      .getAll()
      .then((commands) => setShortcut(commands.find((c) => c.name === COMMAND_CONVERT_SELECTION)?.shortcut ?? ''))
      .catch(() => setShortcut(''));
  }, []);
  return shortcut;
}

export function openShortcutSettings(): void {
  void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
}
