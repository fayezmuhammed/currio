import type { CurrencyCode } from '@/types/currency';
import { displayFractionDigits, formatMoney, formatMoneyWithCode } from '@/utils/formatting';
import { CURRENCIES } from '@/constants/currencies';
import { CurrencyIcon } from './CurrencyIcon';

interface ConversionResultProps {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  converted: number;
  /** Right-aligned caption, e.g. "2 min ago". */
  caption?: string | undefined;
}

/** "$100 USD / ≈ ₹8,830 INR" — the popup's rendering of a conversion. */
export function ConversionResult({ amount, from, to, converted, caption }: ConversionResultProps) {
  const sourceDigits = Number.isInteger(amount) ? 0 : CURRENCIES[from].minorUnits;
  const result = formatMoney(converted, to, { fractionDigits: displayFractionDigits(amount, converted, to) });
  return (
    <div>
      <div className="flex items-center gap-2 text-[12.5px] text-muted">
        <CurrencyIcon code={from} size="sm" />
        <span>{formatMoneyWithCode(amount, from, { fractionDigits: sourceDigits })}</span>
        {caption && <span className="ml-auto text-[11.5px] text-subtle">{caption}</span>}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="w-5 text-center text-[17px] font-medium text-subtle">≈</span>
        <span className="truncate text-[24px] leading-tight font-semibold tracking-[-0.025em] text-fg">{result.text}</span>
        {!result.symbolIsCode && <span className="text-[12px] font-semibold tracking-wide text-muted">{to}</span>}
      </div>
    </div>
  );
}
