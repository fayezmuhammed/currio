import { useEffect, useState } from 'react';
import { chromeStore, onStorageKeyChanged } from '@/platform/storage';
import { RECENT_CONVERSION_KEY, createHistoryService, parseRecent } from '@/services/history-service';
import type { RecentConversion } from '@/types/settings';

const historyService = createHistoryService(chromeStore('local'));

export function useRecentConversion(): RecentConversion | null | undefined {
  // undefined = still loading, null = nothing converted yet
  const [recent, setRecent] = useState<RecentConversion | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    void historyService.getRecent().then((value) => active && setRecent(value));
    const unsubscribe = onStorageKeyChanged('local', RECENT_CONVERSION_KEY, (value) => setRecent(parseRecent(value)));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  return recent;
}
