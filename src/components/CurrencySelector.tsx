import { CURRENCIES } from '@/constants/currencies';
import type { CurrencyCode } from '@/types/currency';
import { CurrencyIcon } from './CurrencyIcon';
import { Icon } from './Icon';

interface CurrencySelectorProps {
  value: CurrencyCode;
  onClick: () => void;
  /** Visually lighter variant for use inside a settings list. */
  compact?: boolean;
}

/** The "🇮🇳 INR  Indian Rupee  ›" row that opens the currency picker. */
export function CurrencySelector({ value, onClick, compact = false }: CurrencySelectorProps) {
  const def = CURRENCIES[value];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Preferred currency: ${def.name}. Change`}
      className={`group flex w-full items-center gap-3 text-left transition-colors hover:bg-inset/70 ${
        compact ? 'px-4 py-3' : 'rounded-2xl px-4 py-3.5'
      }`}
    >
      <CurrencyIcon code={value} size={compact ? 'sm' : 'md'} />
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className={`font-semibold tracking-[-0.01em] text-fg ${compact ? 'text-[13.5px]' : 'text-[15px]'}`}>{def.code}</span>
        <span className="truncate text-[12.5px] text-muted">{def.name}</span>
      </span>
      <Icon name="chevronRight" size={16} className="text-subtle transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
