import { describe, expect, it } from 'vitest';
import { percentChange, percentDifference, percentOf, whatPercent } from './percentage';
import { calculate, format, formatMixed, fromMixed, gcd, lcm, simplify, FractionError } from './fraction';

describe('percentage', () => {
  it('finds a percentage of a number', () => {
    expect(percentOf(15, 200)).toBe(30);
    expect(percentOf(150, 40)).toBe(60);
    expect(percentOf(-10, 50)).toBe(-5);
  });

  it('finds what percent one number is of another', () => {
    expect(whatPercent(30, 200)).toBe(15);
    expect(whatPercent(50, 40)).toBe(125);
    expect(whatPercent(5, 0)).toBeNaN();
  });

  it('finds percentage change', () => {
    expect(percentChange(80, 100)).toBe(25);
    expect(percentChange(100, 80)).toBe(-20);
    expect(percentChange(-50, -25)).toBe(50); // rising towards zero is an increase
    expect(percentChange(0, 10)).toBeNaN();
  });

  it('finds percentage difference', () => {
    expect(percentDifference(80, 100)).toBeCloseTo(22.2222, 4);
    expect(percentDifference(100, 80)).toBeCloseTo(22.2222, 4); // order doesn't matter
    expect(percentDifference(0, 0)).toBeNaN();
  });
});

describe('fraction helpers', () => {
  it('computes gcd and lcm', () => {
    expect(gcd(12, 18)).toBe(6);
    expect(gcd(-4, 6)).toBe(2);
    expect(lcm(4, 6)).toBe(12);
  });

  it('simplifies and keeps the sign on the numerator', () => {
    expect(simplify({ n: 6, d: 8 })).toEqual({ n: 3, d: 4 });
    expect(simplify({ n: 3, d: -6 })).toEqual({ n: -1, d: 2 });
    expect(simplify({ n: 0, d: 5 })).toEqual({ n: 0, d: 1 });
  });

  it('reads mixed numbers', () => {
    expect(fromMixed(2, 3, 4)).toEqual({ n: 11, d: 4 });
    expect(fromMixed(-2, 1, 2)).toEqual({ n: -5, d: 2 });
    expect(fromMixed(0, -3, 4)).toEqual({ n: -3, d: 4 });
    expect(fromMixed(5, 0, 1)).toEqual({ n: 5, d: 1 });
  });

  it('rejects invalid fractions', () => {
    expect(() => fromMixed(0, 1, 0)).toThrow(FractionError);
    expect(() => fromMixed(0, 1.5, 2)).toThrow(FractionError);
    expect(() => fromMixed(1, -1, 2)).toThrow(FractionError);
    expect(() => fromMixed(0, 1, -2)).toThrow(FractionError);
  });

  it('formats improper and mixed forms', () => {
    expect(format({ n: 19, d: 12 })).toBe('19/12');
    expect(formatMixed({ n: 19, d: 12 })).toBe('1 7/12');
    expect(formatMixed({ n: -5, d: 2 })).toBe('−2 1/2');
    expect(formatMixed({ n: 4, d: 1 })).toBe('4');
    expect(formatMixed({ n: -1, d: 3 })).toBe('−1/3');
  });
});

describe('calculate', () => {
  const f = (n: number, d: number) => ({ n, d });

  it('adds with a common denominator', () => {
    const r = calculate(f(3, 4), '+', f(5, 6));
    expect(r.result).toEqual(f(19, 12));
    expect(r.decimal).toBeCloseTo(1.583333, 5);
    expect(r.steps[0]).toContain('is 12');
    expect(r.steps.at(-1)).toContain('1 7/12');
  });

  it('keeps thirds exact', () => {
    expect(calculate(f(1, 3), '+', f(1, 3)).result).toEqual(f(2, 3));
    expect(calculate(f(1, 3), '×', f(3, 1)).result).toEqual(f(1, 1));
  });

  it('subtracts, including below zero', () => {
    expect(calculate(f(1, 2), '-', f(3, 4)).result).toEqual(f(-1, 4));
    expect(calculate(f(5, 8), '-', f(1, 8)).result).toEqual(f(1, 2));
  });

  it('multiplies and simplifies', () => {
    const r = calculate(f(3, 4), '×', f(2, 9));
    expect(r.result).toEqual(f(1, 6));
    expect(r.steps.some((s) => s.includes('dividing top and bottom by 6'))).toBe(true);
  });

  it('divides by flipping the second fraction', () => {
    const r = calculate(f(3, 4), '÷', f(5, 6));
    expect(r.result).toEqual(f(9, 10));
    expect(r.steps[0]).toContain('flip');
    expect(calculate(f(1, 2), '÷', f(-1, 4)).result).toEqual(f(-2, 1));
  });

  it('works with mixed numbers', () => {
    // 2 1/2 × 1 1/3 = 5/2 × 4/3 = 20/6 = 10/3 = 3 1/3
    const r = calculate(fromMixed(2, 1, 2), '×', fromMixed(1, 1, 3));
    expect(formatMixed(r.result)).toBe('3 1/3');
  });

  it('refuses to divide by zero', () => {
    expect(() => calculate(f(1, 2), '÷', f(0, 1))).toThrow(FractionError);
  });
});
