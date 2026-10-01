import { describe, expect, it } from 'vitest';
import {
  displayFractionDigits,
  formatMoney,
  formatMoneyWithCode,
  formatRate,
  formatRelativeTime,
} from '@/utils/formatting';

const en = { locale: 'en-US' };

describe('formatMoney', () => {
  it('uses narrow symbols where available', () => {
    expect(formatMoney(20500, 'INR', { ...en, fractionDigits: 0 })).toEqual({ text: '₹20,500', symbolIsCode: false });
    expect(formatMoney(1299.99, 'EUR', en).text).toBe('€1,299.99');
  });

  it('reports when the symbol is the ISO code', () => {
    const aed = formatMoney(850, 'AED', { ...en, fractionDigits: 0 });
    expect(aed.symbolIsCode).toBe(true);
    expect(formatMoneyWithCode(850, 'AED', { ...en, fractionDigits: 0 })).toBe(aed.text);
    expect(formatMoneyWithCode(100, 'USD', { ...en, fractionDigits: 0 })).toBe('$100 USD');
  });

  it('respects minor units per currency', () => {
    expect(formatMoney(1500, 'JPY', en).text).toBe('¥1,500');
    expect(formatMoney(1.25, 'KWD', en).text).toContain('1.250');
  });

  it('is locale-aware', () => {
    expect(formatMoney(128000.5, 'INR', { locale: 'en-IN' }).text).toBe('₹1,28,000.50');
    expect(formatMoney(1299.99, 'EUR', { locale: 'de-DE' }).text).toMatch(/1\.299,99/);
  });
});

describe('displayFractionDigits', () => {
  it('drops decimals for large conversions of whole amounts', () => {
    expect(displayFractionDigits(100, 8830, 'INR')).toBe(0);
    expect(displayFractionDigits(1000, 88300, 'INR')).toBe(0);
  });

  it('keeps decimals when the source had cents', () => {
    expect(displayFractionDigits(1250.5, 128123.45, 'INR')).toBe(2);
  });

  it('keeps decimals for small results', () => {
    expect(displayFractionDigits(1, 24.12, 'INR')).toBe(2);
    expect(displayFractionDigits(1, 0.27, 'USD')).toBe(2);
    expect(displayFractionDigits(1, 0.0064, 'USD')).toBe(4);
  });

  it('honours zero- and three-decimal currencies', () => {
    expect(displayFractionDigits(10, 50, 'JPY')).toBe(0);
    expect(displayFractionDigits(10.5, 3.2, 'KWD')).toBe(3);
  });
});

describe('formatRate', () => {
  it('shows sensible precision at every magnitude', () => {
    expect(formatRate(24.12, 'INR', 'en-US')).toBe('₹24.12');
    expect(formatRate(3.6725, 'AED', 'en-US')).toContain('3.6725');
    expect(formatRate(157.29828, 'JPY', 'en-US')).toBe('¥157.30');
    expect(formatRate(0.006357, 'USD', 'en-US')).toBe('$0.006357');
    expect(formatRate(0.2723, 'USD', 'en-US')).toBe('$0.2723');
  });
});

describe('formatRelativeTime', () => {
  const now = 1_000_000_000;
  it.each([
    [10_000, 'just now'],
    [2 * 60_000, '2 min ago'],
    [3 * 3_600_000, '3 hr ago'],
    [26 * 3_600_000, 'yesterday'],
    [4 * 86_400_000, '4 days ago'],
  ])('%d ms ago → %s', (ago, label) => {
    expect(formatRelativeTime(now - ago, now)).toBe(label);
  });

  it('treats future timestamps as now', () => {
    expect(formatRelativeTime(now + 5000, now)).toBe('just now');
  });
});
