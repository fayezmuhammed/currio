import { Card, Divider, SectionLabel, SettingRow, Shortcut } from '@/components/Card';
import { CurrencySelector } from '@/components/CurrencySelector';
import { Toggle } from '@/components/Toggle';
import { REFRESH_INTERVAL_OPTIONS_MINUTES } from '@/constants/config';
import { openShortcutSettings, useShortcut } from '@/hooks/useShortcut';
import type { Settings } from '@/types/settings';
import { formatInterval } from '@/utils/formatting';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onPickCurrency: () => void;
}

const SHORT_INTERVAL: Record<number, string> = { 60: '1h', 360: '6h', 720: '12h', 1440: '24h' };

export function SettingsPanel({ settings, onChange, onPickCurrency }: SettingsPanelProps) {
  const shortcut = useShortcut();

  return (
    <div className="space-y-4">
      <div>
        <SectionLabel>Conversion</SectionLabel>
        <Card className="overflow-hidden">
          <div className="px-4 pt-3 text-[12px] font-medium text-muted">Preferred currency</div>
          <CurrencySelector value={settings.preferredCurrency} onClick={onPickCurrency} compact />
          <Divider />
          <SettingRow
            title="Automatic conversion"
            description="Show a card as soon as you select a price."
            control={
              <Toggle label="Automatic conversion" checked={settings.autoConvert} onChange={(autoConvert) => onChange({ autoConvert })} />
            }
          />
          <Divider />
          <SettingRow
            title="Show rate information"
            description="Include the exchange rate and when it was updated."
            control={
              <Toggle label="Show rate information" checked={settings.showRateInfo} onChange={(showRateInfo) => onChange({ showRateInfo })} />
            }
          />
        </Card>
      </div>

      <div>
        <SectionLabel>Exchange rates</SectionLabel>
        <Card className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-[13.5px] font-medium text-fg">Refresh rates</div>
            <div className="text-[12px] text-muted">{formatInterval(settings.refreshIntervalMinutes)}</div>
          </div>
          <div role="radiogroup" aria-label="Refresh interval" className="mt-2.5 grid grid-cols-4 gap-1 rounded-xl bg-inset p-1">
            {REFRESH_INTERVAL_OPTIONS_MINUTES.map((minutes) => {
              const selected = settings.refreshIntervalMinutes === minutes;
              return (
                <button
                  key={minutes}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ refreshIntervalMinutes: minutes })}
                  className={`rounded-lg py-1.5 text-[12.5px] font-semibold transition-all ${
                    selected ? 'bg-surface text-fg shadow-card ring-1 ring-line' : 'text-muted hover:text-fg'
                  }`}
                >
                  {SHORT_INTERVAL[minutes] ?? formatInterval(minutes)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11.5px] leading-snug text-subtle">
            Rates are cached on your device. The provider publishes new rates daily.
          </p>
        </Card>
      </div>

      <div>
        <SectionLabel>Shortcuts</SectionLabel>
        <Card className="overflow-hidden">
          <SettingRow
            title="Keyboard shortcut"
            description="Convert the current selection."
            control={
              <button type="button" onClick={openShortcutSettings} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-inset" title="Change shortcut">
                {shortcut ? <Shortcut value={shortcut} /> : <span className="text-[12px] font-semibold text-brand">Set</span>}
              </button>
            }
          />
          <Divider />
          <SettingRow title="Right-click menu" description="Select text, right-click, then “Convert with Currio”." control={null} />
        </Card>
      </div>

      <div>
        <SectionLabel>Coming soon</SectionLabel>
        <Card>
          <SettingRow
            title="Highlight prices on pages"
            badge="Soon"
            description="Show converted prices next to prices on the page."
            control={<Toggle label="Highlight prices on pages" checked={false} disabled onChange={() => undefined} />}
          />
        </Card>
      </div>
    </div>
  );
}
