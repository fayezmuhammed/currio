import { useEffect, useState, type ReactNode } from 'react';
import { Shortcut } from '@/components/Card';
import { CurrencyIcon } from '@/components/CurrencyIcon';
import { Icon, type IconName } from '@/components/Icon';
import { BrandMark } from '@/components/Logo';
import { SearchableCurrencyList } from '@/components/SearchableCurrencyList';
import { CURRENCIES, POPULAR_CURRENCIES } from '@/constants/currencies';
import { startCurrio } from '@/content/controller';
import { useSettings } from '@/hooks/useSettings';
import { useShortcut } from '@/hooks/useShortcut';
import type { CurrencyCode } from '@/types/currency';

/** Full-page first-run experience, opened in a tab on install. */
export function Onboarding() {
  const { settings, update } = useSettings();
  const [step, setStep] = useState<'currency' | 'ready'>('currency');
  const [choice, setChoice] = useState<CurrencyCode | null>(null);
  const [showAll, setShowAll] = useState(false);

  const selected = choice ?? settings?.preferredCurrency ?? 'INR';

  async function finish(): Promise<void> {
    await update({ preferredCurrency: selected, onboardingCompleted: true });
    setStep('ready');
  }

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-[8vh]">
      <div className="w-full max-w-[460px]">
        <div className="mb-6 flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">Currio</span>
          <span className="ml-auto text-[12px] text-subtle">Step {step === 'currency' ? 1 : 2} of 2</span>
        </div>

        {step === 'currency' ? (
          <section key="currency" className="animate-fade-in rounded-3xl border border-line bg-surface p-7 shadow-raised">
            <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.03em]">Welcome to Currio 👋</h1>
            <p className="mt-2 text-[14.5px] text-muted">Select your preferred currency.</p>

            {showAll ? (
              <div className="mt-6">
                <SearchableCurrencyList value={selected} onSelect={setChoice} autoFocus maxHeight={300} />
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Preferred currency">
                {POPULAR_CURRENCIES.map((code) => (
                  <CurrencyTile key={code} code={code} selected={code === selected} onSelect={() => setChoice(code)} />
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-[13px]">
              <button type="button" onClick={() => setShowAll(!showAll)} className="font-medium text-brand hover:text-brand-strong">
                {showAll ? 'Show popular currencies' : 'More currencies'}
              </button>
              <span className="text-muted">
                {CURRENCIES[selected].flag} {CURRENCIES[selected].name}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void finish()}
              disabled={!settings}
              className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand py-3 text-[14.5px] font-semibold text-on-brand transition-colors hover:bg-brand-strong disabled:opacity-60"
            >
              Continue with {selected}
              <Icon name="chevronRight" size={16} strokeWidth={2.4} />
            </button>
          </section>
        ) : (
          <Ready currency={selected} />
        )}

        <p className="mt-6 text-center text-[12px] text-subtle">
          You can change this any time from the Currio icon in your toolbar.
        </p>
      </div>
    </div>
  );
}

function CurrencyTile({ code, selected, onSelect }: { code: CurrencyCode; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      title={CURRENCIES[code].name}
      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-all ${
        selected ? 'border-brand bg-brand-soft ring-1 ring-brand' : 'border-line hover:border-subtle/50 hover:bg-inset'
      }`}
    >
      <CurrencyIcon code={code} size="md" />
      <span className={`text-[13px] font-semibold ${selected ? 'text-brand' : 'text-fg'}`}>{code}</span>
    </button>
  );
}

const DEMO_PRICES: Partial<Record<CurrencyCode, string>> = { AED: 'AED 850', USD: '$129.99', EUR: '€249' };

function Ready({ currency }: { currency: CurrencyCode }) {
  const shortcut = useShortcut();
  // The real in-page card, running on this page so the demo below is live.
  useEffect(() => {
    const controller = startCurrio();
    return () => controller.destroy();
  }, []);

  const demo = currency === 'AED' ? DEMO_PRICES.USD : DEMO_PRICES.AED;

  return (
    <section key="ready" className="animate-fade-in rounded-3xl border border-line bg-surface p-7 shadow-raised">
      <div className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon name="check" size={22} strokeWidth={2.6} />
      </div>
      <h1 className="mt-4 text-[26px] leading-tight font-semibold tracking-[-0.03em]">You're ready.</h1>
      <p className="mt-2 text-[14.5px] text-muted">Select any currency on a webpage to convert it instantly.</p>

      <div className="mt-6 rounded-2xl border border-dashed border-line bg-inset/60 p-4">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] text-subtle uppercase">
          <Icon name="sparkle" size={12} /> Try it — select the price
        </div>
        <div className="flex items-baseline justify-between gap-4 text-[15px]">
          <span className="text-fg">Marina View Hotel · 1 night</span>
          <span className="font-semibold text-fg select-text">{demo}</span>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        <Tip icon="pointer" title="Select to convert">Highlight a price like “AED 850” or “$1,299.99”.</Tip>
        <Tip icon="keyboard" title="Keyboard shortcut">
          {shortcut ? <Shortcut value={shortcut} /> : 'Assign one at chrome://extensions/shortcuts'}
        </Tip>
        <Tip icon="puzzle" title="Pin Currio">Click the puzzle icon in Chrome's toolbar and pin Currio for quick settings.</Tip>
      </ul>

      <button
        type="button"
        onClick={() => window.close()}
        className="mt-7 w-full rounded-xl bg-fg py-3 text-[14.5px] font-semibold text-surface transition-opacity hover:opacity-90"
      >
        Start browsing
      </button>
    </section>
  );
}

function Tip({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-inset text-muted">
        <Icon name={icon} size={14} />
      </span>
      <div className="text-[13px] leading-snug">
        <div className="font-semibold text-fg">{title}</div>
        <div className="mt-0.5 text-muted">{children}</div>
      </div>
    </li>
  );
}
