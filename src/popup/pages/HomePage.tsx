import { Card, SectionLabel, SettingRow, Shortcut } from '@/components/Card';
import { ConversionResult } from '@/components/ConversionResult';
import { CurrencySelector } from '@/components/CurrencySelector';
import { Icon } from '@/components/Icon';
import { LoadingState } from '@/components/LoadingState';
import { Logo } from '@/components/Logo';
import { RateDisplay } from '@/components/RateDisplay';
import { Toggle } from '@/components/Toggle';
import { useNow } from '@/hooks/useNow';
import { useRateStatus } from '@/hooks/useRateStatus';
import { useRecentConversion } from '@/hooks/useRecentConversion';
import { useShortcut } from '@/hooks/useShortcut';
import type { Settings } from '@/types/settings';
import { formatRelativeTime } from '@/utils/formatting';

interface HomePageProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onOpenSettings: () => void;
  onPickCurrency: () => void;
}

export function HomePage({ settings, onChange, onOpenSettings, onPickCurrency }: HomePageProps) {
  const now = useNow();
  const recent = useRecentConversion();
  const shortcut = useShortcut();
  const sampleFrom = recent && recent.from !== settings.preferredCurrency ? recent.from : settings.preferredCurrency === 'USD' ? 'EUR' : 'USD';
  const rates = useRateStatus(sampleFrom, settings.preferredCurrency);

  return (
    <div className="animate-fade-in">
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <Logo />
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-inset hover:text-fg"
        >
          <Icon name="settings" size={17} />
        </button>
      </header>

      <main className="space-y-4 px-3 pb-3">
        <div>
          <SectionLabel>Preferred currency</SectionLabel>
          <Card>
            <CurrencySelector value={settings.preferredCurrency} onClick={onPickCurrency} />
          </Card>
        </div>

        <div>
          <SectionLabel>Recent conversion</SectionLabel>
          <Card className="px-4 py-3.5">
            {recent === undefined ? (
              <LoadingState lines={2} />
            ) : recent ? (
              <ConversionResult
                amount={recent.amount}
                from={recent.from}
                to={recent.to}
                converted={recent.converted}
                caption={formatRelativeTime(recent.at, now)}
              />
            ) : (
              <EmptyRecent />
            )}
          </Card>
        </div>

        <div>
          <SectionLabel>Exchange rates</SectionLabel>
          <Card className="px-4 py-3">
            <RateDisplay {...rates} onRefresh={() => void rates.refresh()} now={now} />
          </Card>
        </div>

        <Card>
          <SettingRow
            title="Automatic conversion"
            description="Show a card when you select a price."
            control={<Toggle label="Automatic conversion" checked={settings.autoConvert} onChange={(autoConvert) => onChange({ autoConvert })} />}
          />
        </Card>
      </main>

      <footer className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[11px] whitespace-nowrap text-subtle">
        <span className="flex items-center gap-1.5">
          {shortcut ? (
            <>
              <Shortcut value={shortcut} /> to convert
            </>
          ) : (
            'Right-click to convert'
          )}
        </span>
        <a
          href="https://www.exchangerate-api.com"
          target="_blank"
          rel="noreferrer"
          title="Exchange rates by ExchangeRate-API"
          className="hover:text-muted"
        >
          Rates: ExchangeRate-API
        </a>
      </footer>
    </div>
  );
}

function EmptyRecent() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0 rounded-lg border border-line bg-inset px-2 py-1 text-[12px] font-semibold text-fg">
        <span className="rounded-[3px] bg-brand-soft px-0.5 text-brand">AED 850</span>
        <Icon name="pointer" size={12} className="absolute -right-1.5 -bottom-1.5 fill-fg text-surface" strokeWidth={1.5} />
      </div>
      <p className="text-[12.5px] leading-snug text-muted">Select a price on any page and it converts instantly.</p>
    </div>
  );
}
