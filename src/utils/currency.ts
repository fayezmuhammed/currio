import type { RateTable } from '@/types/exchange-rate';

/**
 * Rate to convert 1 unit of `from` into `to`, given a table of rates against
 * `base` (units of currency per 1 base). Returns null if either rate is missing.
 */
export function crossRate(table: RateTable, base: string, from: string, to: string): number | null {
  if (from === to) return 1;
  const fromRate = from === base ? 1 : table[from];
  const toRate = to === base ? 1 : table[to];
  if (!isPositive(fromRate) || !isPositive(toRate)) return null;
  return toRate / fromRate;
}

/** Re-express a rate table against a different base currency. */
export function rebaseRates(table: RateTable, base: string, newBase: string): RateTable | null {
  if (newBase === base) return table;
  const pivot = table[newBase];
  if (!isPositive(pivot)) return null;
  const rebased: Record<string, number> = { [base]: 1 / pivot };
  for (const [code, rate] of Object.entries(table)) {
    if (isPositive(rate)) rebased[code] = rate / pivot;
  }
  rebased[newBase] = 1;
  return rebased;
}

/** Multiply and strip binary floating-point noise (0.1 * 3 → 0.3). */
export function convertAmount(amount: number, rate: number): number {
  return Number((amount * rate).toPrecision(12));
}

function isPositive(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
