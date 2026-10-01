import { useState } from 'react';
import { BrandMark } from '@/components/Logo';
import { SearchableCurrencyList } from '@/components/SearchableCurrencyList';
import { Icon } from '@/components/Icon';
import type { CurrencyCode } from '@/types/currency';
import { CURRENCIES } from '@/constants/currencies';

interface WelcomePageProps {
  initial: CurrencyCode;
  onDone: (currency: CurrencyCode) => void;
}

/** Compact first-run flow inside the popup, for users who closed the onboarding tab. */
export function WelcomePage({ initial, onDone }: WelcomePageProps) {
  const [currency, setCurrency] = useState(initial);

  return (
    <div className="animate-fade-in px-4 pt-5 pb-4">
      <BrandMark size={36} />
      <h1 className="mt-3 text-[19px] font-semibold tracking-[-0.025em] text-fg">Welcome to Currio 👋</h1>
      <p className="mt-1 text-[13px] text-muted">Select your preferred currency.</p>
      <div className="mt-4">
        <SearchableCurrencyList value={currency} onSelect={setCurrency} maxHeight={250} />
      </div>
      <button
        type="button"
        onClick={() => onDone(currency)}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-[13.5px] font-semibold text-on-brand transition-colors hover:bg-brand-strong"
      >
        Continue with {CURRENCIES[currency].code}
        <Icon name="chevronRight" size={15} strokeWidth={2.4} />
      </button>
    </div>
  );
}
