import { describe, expect, it } from 'vitest';
import { convertAmount, crossRate, rebaseRates } from '@/utils/currency';

const USD_RATES = { USD: 1, EUR: 0.9, INR: 88.3, AED: 3.6725, JPY: 150, KWD: 0.3085 };

describe('crossRate', () => {
  it('converts from the base currency', () => {
    expect(crossRate(USD_RATES, 'USD', 'USD', 'INR')).toBe(88.3);
  });

  it('converts to the base currency', () => {
    expect(crossRate(USD_RATES, 'USD', 'INR', 'USD')).toBeCloseTo(1 / 88.3, 12);
  });

  it('cross-converts between two non-base currencies', () => {
    // 1 AED = 88.3 / 3.6725 INR ≈ 24.04
    expect(crossRate(USD_RATES, 'USD', 'AED', 'INR')).toBeCloseTo(24.0436, 4);
    expect(crossRate(USD_RATES, 'USD', 'EUR', 'JPY')).toBeCloseTo(166.6667, 4);
  });

  it('returns 1 for identical currencies', () => {
    expect(crossRate(USD_RATES, 'USD', 'EUR', 'EUR')).toBe(1);
  });

  it('returns null for missing or invalid rates', () => {
    expect(crossRate(USD_RATES, 'USD', 'USD', 'GBP')).toBeNull();
    expect(crossRate({ USD: 1, EUR: 0 }, 'USD', 'EUR', 'USD')).toBeNull();
    expect(crossRate({ USD: 1, EUR: Number.NaN }, 'USD', 'USD', 'EUR')).toBeNull();
  });
});

describe('convertAmount', () => {
  it('matches the README examples', () => {
    expect(convertAmount(100, 88.3)).toBe(8830);
    expect(convertAmount(1000, 88.3)).toBe(88300);
  });

  it('strips floating-point noise', () => {
    expect(convertAmount(0.1, 3)).toBe(0.3);
    expect(convertAmount(1.1, 1.1)).toBe(1.21);
  });

  it('round-trips within rounding error', () => {
    const rate = crossRate(USD_RATES, 'USD', 'AED', 'INR') ?? 0;
    const back = crossRate(USD_RATES, 'USD', 'INR', 'AED') ?? 0;
    expect(convertAmount(convertAmount(850, rate), back)).toBeCloseTo(850, 6);
  });
});

describe('rebaseRates', () => {
  it('re-expresses a table against another base', () => {
    const inr = rebaseRates(USD_RATES, 'USD', 'INR');
    expect(inr?.INR).toBe(1);
    expect(inr?.USD).toBeCloseTo(1 / 88.3, 12);
    expect(inr?.AED).toBeCloseTo(3.6725 / 88.3, 12);
  });

  it('returns null when the new base is missing', () => {
    expect(rebaseRates(USD_RATES, 'USD', 'GBP')).toBeNull();
  });
});
