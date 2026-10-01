import type { RateErrorCode } from '@/types/exchange-rate';
import { Icon } from './Icon';

const MESSAGES: Record<RateErrorCode, { title: string; detail: string }> = {
  'network-unavailable': { title: "You're offline", detail: 'Currio will use cached rates until you reconnect.' },
  'provider-error': { title: 'Rates unavailable', detail: "The rate service didn't respond. Try again shortly." },
  'rate-unavailable': { title: 'Rate unavailable', detail: 'No rate is published for this pair right now.' },
  'unsupported-currency': { title: 'Unsupported currency', detail: 'This currency is not supported yet.' },
  'invalid-amount': { title: 'Invalid amount', detail: "That amount couldn't be read." },
};

export function errorMessage(code: RateErrorCode): { title: string; detail: string } {
  return MESSAGES[code];
}

export function ErrorState({ code, onRetry }: { code: RateErrorCode; onRetry?: () => void }) {
  const { title, detail } = MESSAGES[code];
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-warn-soft px-3 py-2.5" role="alert">
      <Icon name="alert" size={15} className="mt-px shrink-0 text-warn" />
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold text-fg">{title}</div>
        <div className="text-[12px] leading-snug text-muted">{detail}</div>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-[12px] font-semibold text-brand hover:text-brand-strong">
          Retry
        </button>
      )}
    </div>
  );
}
