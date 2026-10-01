import type { ExchangeRate, RateErrorCode, RateStatus } from '@/types/exchange-rate';
import { formatRate, formatRelativeTime } from '@/utils/formatting';
import { ErrorState } from './ErrorState';
import { Icon } from './Icon';
import { LoadingState } from './LoadingState';

interface RateDisplayProps {
  status: RateStatus | null;
  sample: ExchangeRate | null;
  loading: boolean;
  refreshing: boolean;
  error: RateErrorCode | null;
  onRefresh: () => void;
  now: number;
}

/** Cache freshness, a sample rate and a refresh button. */
export function RateDisplay({ status, sample, loading, refreshing, error, onRefresh, now }: RateDisplayProps) {
  if (loading) return <LoadingState lines={2} label="Loading exchange rates" />;

  const cached = Boolean(sample?.isFallback || status?.isStale);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {sample ? (
            <div className="text-[14.5px] font-semibold tracking-[-0.01em] text-fg">
              1 {sample.from} <span className="font-normal text-subtle">=</span> {formatRate(sample.rate, sample.to)}
            </div>
          ) : (
            <div className="text-[13.5px] font-medium text-muted">No rates downloaded yet</div>
          )}
          {status && (
            <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
              <span className={`size-1.5 rounded-full ${cached ? 'bg-warn' : 'bg-ok'}`} aria-hidden="true" />
              {cached ? 'Cached · ' : ''}Updated {formatRelativeTime(status.providerUpdatedAt, now)}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh exchange rates"
          title={status ? `Last checked ${formatRelativeTime(status.fetchedAt, now)}` : 'Refresh exchange rates'}
          className="grid size-8 place-items-center rounded-lg text-subtle transition-colors hover:bg-inset hover:text-fg disabled:opacity-60"
        >
          <Icon name="refresh" size={15} className={refreshing ? 'animate-spin-slow' : ''} />
        </button>
      </div>
      {error && !sample && <ErrorState code={error} onRetry={onRefresh} />}
      {error && sample?.isFallback && (
        <p className="text-[11.5px] leading-snug text-warn">Can't reach the rate service, so Currio is using the last saved rates.</p>
      )}
    </div>
  );
}
