import { Card, SectionLabel } from '@/components/Card';
import { Icon } from '@/components/Icon';
import type { Settings } from '@/types/settings';
import { PageHeader } from '../components/PageHeader';
import { SettingsPanel } from '../components/SettingsPanel';

interface SettingsPageProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onBack: () => void;
  onPickCurrency: () => void;
}

export function SettingsPage({ settings, onChange, onBack, onPickCurrency }: SettingsPageProps) {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" onBack={onBack} />
      <main className="space-y-4 px-3 pb-4">
        <SettingsPanel settings={settings} onChange={onChange} onPickCurrency={onPickCurrency} />

        <div>
          <SectionLabel>Privacy</SectionLabel>
          <Card className="flex gap-3 px-4 py-3">
            <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-[12px] leading-relaxed text-muted">
              Currio reads only the text you select, and only on your device. It never sends page content, tracks your
              browsing, or stores what you select. The only network request fetches public exchange rates.
            </p>
          </Card>
        </div>

        <p className="px-1 text-center text-[11px] text-subtle">
          Currio {chrome.runtime.getManifest().version} · Rates by{' '}
          <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
            ExchangeRate-API
          </a>
        </p>
      </main>
    </div>
  );
}
