/**
 * Fair random integers.
 *
 * Uses the browser's cryptographic generator (crypto.getRandomValues)
 * and rejection sampling, so every number in the range is exactly as
 * likely as any other. The common `Math.floor(Math.random() * n)` and
 * `x % n` approaches are slightly biased for most ranges.
 */

/** Returns a uniformly random 32-bit unsigned integer. */
export type Random32 = () => number;

export const cryptoRandom32: Random32 = () => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
};

const TWO_32 = 2 ** 32;

/** Uniform integer in [min, max], both inclusive. Range size must be ≤ 2^32. */
export function randomInt(min: number, max: number, rand: Random32 = cryptoRandom32): number {
  const size = max - min + 1;
  // Discard values from the incomplete final block so the modulo is unbiased.
  const limit = TWO_32 - (TWO_32 % size);
  let x: number;
  do x = rand();
  while (x >= limit);
  return min + (x % size);
}

export interface DrawOptions {
  min: number;
  max: number;
  count: number;
  /** No repeats (like drawing raffle tickets). */
  unique: boolean;
  sort: 'none' | 'asc' | 'desc';
}

export const MAX_COUNT = 1000;

export class DrawError extends Error {}

export function draw({ min, max, count, unique, sort }: DrawOptions, rand: Random32 = cryptoRandom32): number[] {
  if (![min, max, count].every(Number.isInteger)) throw new DrawError('Use whole numbers');
  if (min > max) throw new DrawError('The minimum must not be larger than the maximum');
  if (count < 1 || count > MAX_COUNT) throw new DrawError(`Choose between 1 and ${MAX_COUNT} numbers`);
  const size = max - min + 1;
  if (size > TWO_32) throw new DrawError('That range is too large');
  if (unique && count > size) throw new DrawError(`There are only ${size} different numbers in that range`);

  let out: number[];
  if (!unique) out = Array.from({ length: count }, () => randomInt(min, max, rand));
  else if (count > size / 2) {
    // Shuffle the whole range (Fisher–Yates) and take the first `count`.
    const all = Array.from({ length: size }, (_, i) => min + i);
    for (let i = all.length - 1; i > 0; i--) {
      const j = randomInt(0, i, rand);
      [all[i], all[j]] = [all[j], all[i]];
    }
    out = all.slice(0, count);
  } else {
    const seen = new Set<number>();
    while (seen.size < count) seen.add(randomInt(min, max, rand));
    out = [...seen];
  }

  if (sort === 'asc') out.sort((a, b) => a - b);
  else if (sort === 'desc') out.sort((a, b) => b - a);
  return out;
}
