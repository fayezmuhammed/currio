import { useCallback, useEffect, useState } from 'react';
import { chromeStore, onStorageKeyChanged } from '@/platform/storage';
import { SETTINGS_KEY, createSettingsService, sanitizeSettings } from '@/services/settings-service';
import type { Settings } from '@/types/settings';

const settingsService = createSettingsService(chromeStore('sync'));

/** Settings from chrome.storage.sync, live-updated across popup, onboarding and other devices. */
export function useSettings(): {
  settings: Settings | null;
  update: (patch: Partial<Settings>) => Promise<void>;
} {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let active = true;
    void settingsService.get().then((value) => active && setSettings(value));
    const unsubscribe = onStorageKeyChanged('sync', SETTINGS_KEY, (value) => setSettings(sanitizeSettings(value)));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev)); // optimistic
    setSettings(await settingsService.update(patch));
  }, []);

  return { settings, update };
}
