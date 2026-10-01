import { CURRENCIES } from '@/constants/currencies';
import type { CurrencyCode } from '@/types/currency';
import { supportsFlagEmoji } from '@/utils/platform';

const FLAGS = supportsFlagEmoji();

const SIZES = {
  sm: 'size-5 text-[15px]',
  md: 'size-7 text-[19px]',
  lg: 'size-10 text-[26px]',
} as const;

const BADGE_SIZES = {
  sm: 'size-5 text-[9px]',
  md: 'size-7 text-[11px]',
  lg: 'size-10 text-[14px]',
} as const;

interface CurrencyIconProps {
  code: CurrencyCode;
  size?: keyof typeof SIZES;
}

/** Flag emoji, or a symbol badge on platforms without flag glyphs (Windows). */
export function CurrencyIcon({ code, size = 'md' }: CurrencyIconProps) {
  const def = CURRENCIES[code];
  if (FLAGS) {
    return (
      <span className={`inline-grid shrink-0 place-items-center leading-none ${SIZES[size]}`} aria-hidden="true">
        {def.flag}
      </span>
    );
  }
  const label = Array.from(def.symbol).length <= 2 ? def.symbol : code.slice(0, 2);
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand ${BADGE_SIZES[size]}`}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}
