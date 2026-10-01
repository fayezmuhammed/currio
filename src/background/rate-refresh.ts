import { rateService, settingsService } from './services';

const ALARM_NAME = 'currio-refresh-rates';

/** Keep the cache warm so conversions are instant, at the user's refresh interval. */
export async function scheduleRateRefresh(): Promise<void> {
  const { refreshIntervalMinutes } = await settingsService.get();
  const existing = await chrome.alarms.get(ALARM_NAME);
  if (existing?.periodInMinutes === refreshIntervalMinutes) return;
  await chrome.alarms.create(ALARM_NAME, { delayInMinutes: 1, periodInMinutes: refreshIntervalMinutes });
}

export function registerRateRefreshHandler(): void {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) void rateService.refresh().catch(() => undefined);
  });
}

export function warmRates(): void {
  void rateService.refresh().catch(() => undefined);
}
