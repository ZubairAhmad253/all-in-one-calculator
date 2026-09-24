/**
 * Currency conversion through a common base currency.
 * Pure functions only: no fetching, no DOM.
 */

/** Units of each currency per 1 unit of the base currency. */
export type Rates = Record<string, number>;

export interface RateTable {
  base: string;
  rates: Rates;
  /** When the provider last updated the rates (Unix seconds). */
  updated: number;
}

/**
 * Rate to turn 1 `from` into `to`. Both rates are quoted against the same
 * base, so from → to = rates[to] ÷ rates[from]. Returns NaN if either
 * currency is unknown.
 */
export function crossRate(rates: Rates, from: string, to: string): number {
  const f = rates[from];
  const t = rates[to];
  if (!(f > 0) || !(t > 0)) return Number.NaN;
  return from === to ? 1 : t / f;
}

export function convert(amount: number, rates: Rates, from: string, to: string): number {
  return (Number.isFinite(amount) ? amount : 0) * crossRate(rates, from, to);
}

/**
 * Decimal places to show for an exchange rate: at least 4 significant
 * digits, so tiny rates like 1 JPY = 0.00670 USD don't round to 0.
 */
export function rateDecimals(rate: number): number {
  if (!(rate > 0)) return 2;
  const magnitude = Math.floor(Math.log10(rate));
  return Math.min(Math.max(3 - magnitude, 2), 8);
}

/** Basic shape check for data coming back from the rates API. */
export function isRateTable(data: unknown): data is RateTable {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<RateTable>;
  return (
    typeof d.base === 'string' &&
    typeof d.updated === 'number' &&
    !!d.rates &&
    typeof d.rates === 'object' &&
    Object.keys(d.rates).length > 10 &&
    Object.values(d.rates).every((v) => typeof v === 'number' && v > 0)
  );
}
