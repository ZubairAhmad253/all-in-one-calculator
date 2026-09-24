/**
 * The four everyday percentage questions. Each returns NaN when the
 * answer is undefined (e.g. a change from 0), so the UI can explain why.
 */

/** What is `pct`% of `of`? */
export const percentOf = (pct: number, of: number) => (pct / 100) * of;

/** `part` is what percent of `whole`? */
export const whatPercent = (part: number, whole: number) => (whole === 0 ? Number.NaN : (part / whole) * 100);

/**
 * Percentage change from `from` to `to`. Divides by |from| so a move from
 * −50 to −25 reads as a 50% increase, not a decrease.
 */
export const percentChange = (from: number, to: number) => (from === 0 ? Number.NaN : ((to - from) / Math.abs(from)) * 100);

/**
 * Percentage difference: the gap between two values relative to their
 * average, used when neither value is the "starting" one.
 */
export function percentDifference(a: number, b: number): number {
  const avg = (Math.abs(a) + Math.abs(b)) / 2;
  return avg === 0 ? Number.NaN : (Math.abs(a - b) / avg) * 100;
}
