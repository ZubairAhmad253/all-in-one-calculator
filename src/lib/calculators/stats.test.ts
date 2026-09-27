import { describe, expect, it } from 'vitest';
import {
  addMatrices,
  atLeastOnce,
  binomial,
  combinations,
  combinationsWithRepetition,
  determinant,
  inverse,
  multiplyMatrices,
  parseScientific,
  permutations,
  permutationsWithRepetition,
  roundSig,
  roundTo,
  spread,
  summarize,
  toScientific,
  transpose,
  twoEvents,
  weightedMean,
} from './stats';

describe('rounding', () => {
  it('rounds half away from zero, avoiding binary float traps', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(2.345, 2)).toBe(2.35);
    expect(roundTo(-2.5, 0)).toBe(-3);
    expect(roundTo(1234.5678, -2)).toBe(1200);
  });
  it('supports other modes', () => {
    expect(roundTo(2.5, 0, 'half-even')).toBe(2);
    expect(roundTo(3.5, 0, 'half-even')).toBe(4);
    expect(roundTo(2.01, 0, 'up')).toBe(3);
    expect(roundTo(2.99, 0, 'down')).toBe(2);
    expect(roundTo(-2.7, 0, 'toward-zero')).toBe(-2);
    expect(roundTo(-2.2, 0, 'down')).toBe(-3);
  });
  it('rounds to significant figures', () => {
    expect(roundSig(123_456, 3)).toBe(123_000);
    expect(roundSig(0.0012345, 2)).toBe(0.0012);
    expect(roundSig(9.996, 3)).toBe(10);
  });
});

describe('scientific notation', () => {
  it('converts to mantissa and exponent', () => {
    expect(toScientific(123_400)).toEqual({ mantissa: 1.234, exponent: 5 });
    expect(toScientific(0.00042)).toEqual({ mantissa: 4.2, exponent: -4 });
    expect(toScientific(-6.022e23)).toEqual({ mantissa: -6.022, exponent: 23 });
    expect(toScientific(123_400, true)).toEqual({ mantissa: 123.4, exponent: 3 });
  });
  it('parses the common written forms', () => {
    expect(parseScientific('6.022e23')).toBe(6.022e23);
    expect(parseScientific('6.022 × 10^23')).toBe(6.022e23);
    expect(parseScientific('1.5x10^-3')).toBe(0.0015);
    expect(parseScientific('12,000')).toBe(12_000);
    expect(parseScientific('abc')).toBeNaN();
  });
});

describe('averages', () => {
  it('summarises a data set', () => {
    const s = summarize([2, 4, 4, 4, 5, 5, 7, 9])!;
    expect(s.mean).toBe(5);
    expect(s.median).toBe(4.5);
    expect(s.modes).toEqual([4]);
    expect(s.range).toBe(7);
    expect(s.count).toBe(8);
  });
  it('handles odd counts, no mode and several modes', () => {
    expect(summarize([3, 1, 2])!.median).toBe(2);
    expect(summarize([1, 2, 3])!.modes).toEqual([]);
    expect(summarize([1, 1, 2, 2, 3])!.modes).toEqual([1, 2]);
    expect(summarize([])).toBeNull();
  });
  it('computes geometric, harmonic and weighted means', () => {
    const s = summarize([2, 8])!;
    expect(s.geometricMean).toBeCloseTo(4, 10);
    expect(s.harmonicMean).toBeCloseTo(3.2, 10);
    expect(summarize([-1, 2])!.geometricMean).toBeNaN();
    expect(weightedMean([90, 80], [3, 1])).toBe(87.5);
  });
});

describe('spread', () => {
  it('computes population and sample standard deviation', () => {
    const s = spread([2, 4, 4, 4, 5, 5, 7, 9])!;
    expect(s.populationSD).toBe(2);
    expect(s.sampleSD).toBeCloseTo(2.13809, 5);
    expect(s.populationVariance).toBe(4);
    expect(s.ss).toBe(32);
  });
  it('has no sample SD for a single value', () => {
    expect(spread([5])!.sampleSD).toBeNaN();
  });
});

describe('probability', () => {
  it('combines two independent events', () => {
    const r = twoEvents(0.5, 0.4);
    expect(r.and).toBe(0.2);
    expect(r.or).toBeCloseTo(0.7, 12);
    expect(r.neither).toBeCloseTo(0.3, 12);
    expect(r.xor).toBeCloseTo(0.5, 12);
  });
  it('finds the chance of at least one success', () => {
    expect(atLeastOnce(1 / 6, 4)).toBeCloseTo(0.5177, 4);
  });
  it('computes binomial probabilities', () => {
    expect(binomial(10, 5, 0.5)).toBeCloseTo(0.24609375, 10);
    expect(binomial(3, 0, 0)).toBe(1);
    expect(binomial(1000, 500, 0.5)).toBeCloseTo(0.02523, 5);
  });
});

describe('permutations and combinations', () => {
  it('computes nPr and nCr exactly', () => {
    expect(permutations(10, 3)).toBe(720n);
    expect(combinations(10, 3)).toBe(120n);
    expect(combinations(49, 6)).toBe(13_983_816n);
    expect(combinations(52, 5)).toBe(2_598_960n);
    expect(combinations(100, 50)).toBe(100891344545564193334812497256n);
    expect(combinations(5, 7)).toBe(0n);
  });
  it('handles repetition', () => {
    expect(permutationsWithRepetition(10, 4)).toBe(10_000n);
    expect(combinationsWithRepetition(3, 2)).toBe(6n);
  });
});

describe('matrices', () => {
  const a = [
    [1, 2],
    [3, 4],
  ];
  it('adds, multiplies and transposes', () => {
    expect(addMatrices(a, a)).toEqual([
      [2, 4],
      [6, 8],
    ]);
    expect(multiplyMatrices(a, a)).toEqual([
      [7, 10],
      [15, 22],
    ]);
    expect(multiplyMatrices(a, [[1, 2, 3]])).toBeNull();
    expect(transpose([[1, 2, 3]])).toEqual([[1], [2], [3]]);
  });
  it('computes determinants and inverses', () => {
    expect(determinant(a)).toBe(-2);
    expect(determinant([[2, 0, 1], [1, 3, 2], [1, 1, 1]])).toBe(0); // singular: 2(3−2) − 0 + 1(1−3) = 0
    expect(determinant([[2, 0, 1], [1, 3, 2], [1, 1, 2]])).toBeCloseTo(6, 10); // 2(6−2) + 1(1−3) = 6
    const inv = inverse(a)!;
    expect(inv[0][0]).toBeCloseTo(-2, 10);
    expect(inv[0][1]).toBeCloseTo(1, 10);
    expect(inv[1][0]).toBeCloseTo(1.5, 10);
    expect(inv[1][1]).toBeCloseTo(-0.5, 10);
    expect(inverse([[1, 2], [2, 4]])).toBeNull();
  });
});
