import { describe, expect, it } from 'vitest';
import { memoryStore } from '@/platform/storage';
import { createRateCache, isFresh } from '@/services/cache-service';
import { createExchangeRateService } from '@/services/exchange-rate-service';
import { RateError, type ExchangeRateProvider } from '@/services/providers/types';

const HOUR = 3_600_000;

function fakeProvider(rates: Record<string, number> = { USD: 1, INR: 88.3, AED: 3.6725, EUR: 0.9 }) {
  const state = { calls: 0, fail: null as RateError | null, rates };
  const provider: ExchangeRateProvider = {
    id: 'fake',
    name: 'Fake',
    attributionUrl: 'https://example.com',
    fetchLatest(base) {
      state.calls++;
      if (state.fail) return Promise.reject(state.fail);
      return Promise.resolve({ base, rates: state.rates, providerUpdatedAt: 1_000 });
    },
  };
  return { provider, state };
}

function setup(ttlHours = 6) {
  const clock = { now: 10 * HOUR };
  const { provider, state } = fakeProvider();
  const cache = createRateCache(memoryStore());
  const service = createExchangeRateService({
    provider,
    cache,
    getTtlMs: () => Promise.resolve(ttlHours * HOUR),
    now: () => clock.now,
  });
  return { service, state, clock, cache };
}

describe('exchange-rate service', () => {
  it('converts using cross rates from a single base snapshot', async () => {
    const { service } = setup();
    const result = await service.convert(850, 'AED', 'INR');
    expect(result.rate).toBeCloseTo(88.3 / 3.6725, 10);
    expect(result.converted).toBeCloseTo(850 * (88.3 / 3.6725), 6);
    expect(result.isFallback).toBe(false);
  });

  it('caches rates and does not refetch while fresh', async () => {
    const { service, state, clock } = setup();
    await service.convert(100, 'USD', 'INR');
    clock.now += 5 * HOUR;
    await service.convert(5, 'EUR', 'AED');
    await service.getExchangeRate('AED', 'INR');
    expect(state.calls).toBe(1);
  });

  it('refetches once the cache is stale', async () => {
    const { service, state, clock } = setup();
    await service.convert(100, 'USD', 'INR');
    clock.now += 7 * HOUR;
    await service.convert(100, 'USD', 'INR');
    expect(state.calls).toBe(2);
  });

  it('de-duplicates concurrent requests', async () => {
    const { service, state } = setup();
    await Promise.all([service.convert(1, 'USD', 'INR'), service.convert(2, 'EUR', 'INR'), service.getRates('INR')]);
    expect(state.calls).toBe(1);
  });

  it('falls back to stale cached rates when the provider fails, and flags them', async () => {
    const { service, state, clock } = setup();
    await service.convert(100, 'USD', 'INR');
    clock.now += 7 * HOUR;
    state.fail = new RateError('network-unavailable');
    const result = await service.convert(100, 'USD', 'INR');
    expect(result.converted).toBe(8830);
    expect(result.isFallback).toBe(true);
  });

  it('backs off after a failure instead of retrying on every selection', async () => {
    const { service, state, clock } = setup();
    await service.convert(100, 'USD', 'INR');
    clock.now += 7 * HOUR;
    state.fail = new RateError('network-unavailable');
    await service.convert(1, 'USD', 'INR');
    await service.convert(2, 'USD', 'INR');
    expect(state.calls).toBe(2);
    clock.now += 2 * 60_000;
    state.fail = null;
    const recovered = await service.convert(3, 'USD', 'INR');
    expect(recovered.isFallback).toBe(false);
    expect(state.calls).toBe(3);
  });

  it('throws a typed error when there is no cache and the provider fails', async () => {
    const { service, state } = setup();
    state.fail = new RateError('network-unavailable');
    await expect(service.convert(1, 'USD', 'INR')).rejects.toMatchObject({ code: 'network-unavailable' });
  });

  it('reports a missing rate', async () => {
    const { service } = setup();
    await expect(service.convert(1, 'USD', 'GBP')).rejects.toMatchObject({ code: 'rate-unavailable' });
  });

  it('rejects unsupported currencies and invalid amounts', async () => {
    const { service } = setup();
    await expect(service.getExchangeRate('XYZ' as 'USD', 'INR')).rejects.toMatchObject({ code: 'unsupported-currency' });
    await expect(service.convert(Number.NaN, 'USD', 'INR')).rejects.toMatchObject({ code: 'invalid-amount' });
  });

  it('getRates rebases on the requested currency', async () => {
    const { service } = setup();
    const { rates } = await service.getRates('INR');
    expect(rates.INR).toBe(1);
    expect(rates.USD).toBeCloseTo(1 / 88.3, 12);
  });

  it('exposes cache status without fetching', async () => {
    const { service, state, clock } = setup();
    expect(await service.getStatus()).toBeNull();
    expect(state.calls).toBe(0);
    await service.refresh();
    expect(await service.getStatus()).toMatchObject({ isStale: false, provider: 'fake', fetchedAt: 10 * HOUR });
    clock.now += 7 * HOUR;
    expect((await service.getStatus())?.isStale).toBe(true);
  });

  it('forced refresh surfaces failures instead of silently using the cache', async () => {
    const { service, state } = setup();
    await service.refresh();
    state.fail = new RateError('provider-error');
    await expect(service.refresh(true)).rejects.toBeInstanceOf(RateError);
  });

  it('ignores a cache written by a different provider', async () => {
    const { cache } = setup();
    await cache.write({ base: 'USD', rates: { INR: 80 }, fetchedAt: 0, providerUpdatedAt: 0, provider: 'other' });
    expect(await cache.read('fake')).toBeNull();
  });
});

describe('cache-service', () => {
  it('discards malformed snapshots', async () => {
    const store = memoryStore({ 'currio.rates.v1': { base: 'USD', rates: 'nope', fetchedAt: 1 } });
    expect(await createRateCache(store).read('fake')).toBeNull();
  });

  it('drops non-numeric rates from storage', async () => {
    const store = memoryStore({
      'currio.rates.v1': { base: 'USD', rates: { INR: 88, EUR: 'x', bad: 1 }, fetchedAt: 1, providerUpdatedAt: 1, provider: 'fake' },
    });
    expect((await createRateCache(store).read('fake'))?.rates).toEqual({ INR: 88 });
  });

  it('isFresh respects the TTL', () => {
    const snapshot = { base: 'USD', rates: {}, fetchedAt: 1000, providerUpdatedAt: 0, provider: 'x' };
    expect(isFresh(snapshot, 500, 1400)).toBe(true);
    expect(isFresh(snapshot, 500, 1600)).toBe(false);
    expect(isFresh(snapshot, 500, 900)).toBe(false); // clock went backwards
  });
});
