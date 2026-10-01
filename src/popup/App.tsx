import { useState } from 'react';
import { LoadingState } from '@/components/LoadingState';
import { useSettings } from '@/hooks/useSettings';
import type { CurrencyCode } from '@/types/currency';
import { CurrencyPickerPage } from './pages/CurrencyPickerPage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { WelcomePage } from './pages/WelcomePage';

type Page = 'home' | 'settings';
type Route = { name: Page } | { name: 'picker'; returnTo: Page };

export function App() {
  const { settings, update } = useSettings();
  const [route, setRoute] = useState<Route>({ name: 'home' });

  if (!settings) {
    return (
      <div className="p-5">
        <LoadingState lines={3} />
      </div>
    );
  }

  if (!settings.onboardingCompleted) {
    return (
      <WelcomePage
        initial={settings.preferredCurrency}
        onDone={(preferredCurrency) => void update({ preferredCurrency, onboardingCompleted: true })}
      />
    );
  }

  const change = (patch: Parameters<typeof update>[0]): void => void update(patch);

  switch (route.name) {
    case 'settings':
      return (
        <SettingsPage
          settings={settings}
          onChange={change}
          onBack={() => setRoute({ name: 'home' })}
          onPickCurrency={() => setRoute({ name: 'picker', returnTo: 'settings' })}
        />
      );
    case 'picker':
      return (
        <CurrencyPickerPage
          value={settings.preferredCurrency}
          onBack={() => setRoute({ name: route.returnTo })}
          onSelect={(preferredCurrency: CurrencyCode) => {
            change({ preferredCurrency });
            setRoute({ name: route.returnTo });
          }}
        />
      );
    default:
      return (
        <HomePage
          settings={settings}
          onChange={change}
          onOpenSettings={() => setRoute({ name: 'settings' })}
          onPickCurrency={() => setRoute({ name: 'picker', returnTo: 'home' })}
        />
      );
  }
}
