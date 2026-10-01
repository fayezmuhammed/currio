import { useCallback, useEffect, useState } from 'react';
import { sendToBackground } from '@/platform/messaging';
import type { CurrencyCode } from '@/types/currency';
import type { ExchangeRate, RateErrorCode, RateStatus } from '@/types/exchange-rate';

export interface RateStatusState {
  status: RateStatus | null;
  sample: ExchangeRate | null;
  loading: boolean;
  refreshing: boolean;
  error: RateErrorCode | null;
  refresh: () => Promise<void>;
}

interface RateData {
  status: RateStatus | null;
  sample: ExchangeRate | null;
  error: RateErrorCode | null;
}

async function fetchRateData(from: CurrencyCode, to: CurrencyCode): Promise<RateData> {
  try {
    // Look up the rate first (fetching if needed) so the status reflects it.
    const rate = await sendToBackground({ type: 'currio/rate', from, to });
    const status = await sendToBackground({ type: 'currio/rate-status' });
    return {
      sample: rate.ok ? rate.value : null,
      error: rate.ok ? null : rate.error,
      status: status.ok ? status.value : null,
    };
  } catch {
    return { sample: null, status: null, error: 'provider-error' };
  }
}

/** Cache status plus one sample rate (e.g. 1 USD → INR) for the popup. */
export function useRateStatus(from: CurrencyCode, to: CurrencyCode): RateStatusState {
  const [data, setData] = useState<RateData>({ status: null, sample: null, error: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchRateData(from, to).then((next) => {
      if (!active) return;
      setData(next);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [from, to]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await sendToBackground({ type: 'currio/refresh-rates' });
      const next = await fetchRateData(from, to);
      setData(response.ok ? next : { ...next, error: response.error });
    } catch {
      setData((prev) => ({ ...prev, error: 'provider-error' }));
    } finally {
      setRefreshing(false);
    }
  }, [from, to]);

  return { ...data, loading, refreshing, refresh };
}
