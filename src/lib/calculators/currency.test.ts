import { describe, expect, it } from 'vitest';
import { convert, crossRate, isRateTable, rateDecimals } from './currency';

// Illustrative USD-based rates.
const rates = { USD: 1, EUR: 0.88, GBP: 0.75, INR: 96, PKR: 277, JPY: 150 };

describe('crossRate', () => {
  it('uses the base rate directly when converting from the base', () => {
    expect(crossRate(rates, 'USD', 'EUR')).toBe(0.88);
  });

  it('crosses through the base for other pairs', () => {
    expect(crossRate(rates, 'EUR', 'GBP')).toBeCloseTo(0.75 / 0.88, 12);
    expect(crossRate(rates, 'INR', 'PKR')).toBeCloseTo(277 / 96, 12);
  });

  it('gives reciprocal rates in each direction', () => {
    expect(crossRate(rates, 'GBP', 'JPY') * crossRate(rates, 'JPY', 'GBP')).toBeCloseTo(1, 12);
  });

  it('is exactly 1 for the same currency', () => {
    expect(crossRate(rates, 'PKR', 'PKR')).toBe(1);
  });

  it('returns NaN for unknown currencies', () => {
    expect(crossRate(rates, 'USD', 'XYZ')).toBeNaN();
    expect(crossRate(rates, 'XYZ', 'USD')).toBeNaN();
  });
});

describe('convert', () => {
  it('converts amounts', () => {
    expect(convert(100, rates, 'USD', 'PKR')).toBe(27_700);
    expect(convert(88, rates, 'EUR', 'USD')).toBeCloseTo(100, 10);
  });

  it('round-trips without drift', () => {
    const there = convert(1234.56, rates, 'GBP', 'INR');
    expect(convert(there, rates, 'INR', 'GBP')).toBeCloseTo(1234.56, 8);
  });

  it('treats non-numbers as zero', () => {
    expect(convert(Number.NaN, rates, 'USD', 'EUR')).toBe(0);
  });
});

describe('rateDecimals', () => {
  it('keeps at least 4 significant digits', () => {
    expect(rateDecimals(277)).toBe(2);
    expect(rateDecimals(1.1364)).toBe(3);
    expect(rateDecimals(0.88)).toBe(4);
    expect(rateDecimals(0.0036)).toBe(6);
  });
});

describe('isRateTable', () => {
  const many = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`C${i}`, i + 1]));

  it('accepts a well-formed table', () => {
    expect(isRateTable({ base: 'USD', updated: 1_790_208_152, rates: many })).toBe(true);
  });

  it('rejects malformed data', () => {
    expect(isRateTable(null)).toBe(false);
    expect(isRateTable({ base: 'USD', rates: many })).toBe(false);
    expect(isRateTable({ base: 'USD', updated: 1, rates: { USD: 1 } })).toBe(false);
    expect(isRateTable({ base: 'USD', updated: 1, rates: { ...many, BAD: -1 } })).toBe(false);
  });
});
