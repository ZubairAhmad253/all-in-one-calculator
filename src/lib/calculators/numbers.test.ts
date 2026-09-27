import { describe, expect, it } from 'vitest';
import {
  divisors,
  factorialBig,
  factorialTrailingZeros,
  gcd,
  gcdAll,
  isPrime,
  lcmAll,
  logBase,
  nextPrime,
  nthRoot,
  powBig,
  previousPrime,
  primeFactors,
  quadratic,
  simplifyRadical,
  simplifyRatio,
  solveProportion,
} from './numbers';

describe('gcd / lcm', () => {
  it('works for pairs and lists', () => {
    expect(gcd(48, 18)).toBe(6);
    expect(gcdAll([12, 18, 30])).toBe(6);
    expect(lcmAll([4, 6])).toBe(12n);
    expect(lcmAll([12, 18, 30])).toBe(180n);
    expect(lcmAll([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(2520n);
  });
  it('stays exact beyond 2^53', () => {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53];
    expect(lcmAll(primes)).toBe(32589158477190044730n);
  });
});

describe('ratio', () => {
  it('simplifies ratios, including decimals and three terms', () => {
    expect(simplifyRatio([12, 18])).toEqual([2, 3]);
    expect(simplifyRatio([1.5, 2.25])).toEqual([2, 3]);
    expect(simplifyRatio([4, 8, 12])).toEqual([1, 2, 3]);
    expect(simplifyRatio([16, 9])).toEqual([16, 9]);
  });
  it('solves proportions', () => {
    expect(solveProportion(3, 4, 12)).toBe(16);
    expect(solveProportion(0, 4, 12)).toBeNaN();
  });
});

describe('quadratic', () => {
  it('finds two real roots', () => {
    const r = quadratic(1, -5, 6);
    expect(r.kind).toBe('two');
    expect(r.roots.map((x) => x.re)).toEqual([2, 3]);
    expect(r.discriminant).toBe(1);
    expect(r.vertex).toEqual({ x: 2.5, y: -0.25 });
  });
  it('finds a repeated root and complex roots', () => {
    expect(quadratic(1, -4, 4)).toMatchObject({ kind: 'one', roots: [{ re: 2, im: 0 }] });
    const c = quadratic(1, 2, 5);
    expect(c.kind).toBe('complex');
    expect(c.roots).toEqual([{ re: -1, im: -2 }, { re: -1, im: 2 }]);
  });
  it('stays accurate when b² is much larger than 4ac', () => {
    const r = quadratic(1, 1e8, 1);
    expect(r.roots[1].re).toBeCloseTo(-1e-8, 20);
  });
  it('handles linear and degenerate equations', () => {
    expect(quadratic(0, 2, -8)).toMatchObject({ kind: 'linear', roots: [{ re: 4, im: 0 }] });
    expect(quadratic(0, 0, 5).kind).toBe('none');
  });
});

describe('primes', () => {
  it('tests primality', () => {
    expect([2, 3, 5, 7, 11, 97].every(isPrime)).toBe(true);
    expect([0, 1, 4, 9, 91, 100].some(isPrime)).toBe(false);
    expect(isPrime(2_147_483_647)).toBe(true); // Mersenne prime 2^31 − 1
    expect(isPrime(9_007_199_254_740_881)).toBe(true); // largest prime below 2^53
  });
  it('factorises and lists divisors', () => {
    expect(primeFactors(360)).toEqual([[2, 3], [3, 2], [5, 1]]);
    expect(primeFactors(97)).toEqual([[97, 1]]);
    expect(divisors(28)).toEqual([1, 2, 4, 7, 14, 28]);
  });
  it('finds neighbouring primes', () => {
    expect(nextPrime(100)).toBe(101);
    expect(previousPrime(100)).toBe(97);
    expect(previousPrime(2)).toBeNull();
  });
});

describe('factorial', () => {
  it('is exact for large n', () => {
    expect(factorialBig(0)).toBe(1n);
    expect(factorialBig(20)).toBe(2432902008176640000n);
    expect(factorialBig(25).toString()).toBe('15511210043330985984000000');
    expect(factorialBig(100).toString().length).toBe(158);
  });
  it('counts trailing zeros', () => {
    expect(factorialTrailingZeros(25)).toBe(6);
    expect(factorialTrailingZeros(100)).toBe(24);
  });
});

describe('powers, logs and roots', () => {
  it('computes exact integer powers', () => {
    expect(powBig(2, 64)).toBe(18446744073709551616n);
    expect(powBig(2, -1)).toBeNull();
  });
  it('computes logarithms exactly for powers', () => {
    expect(logBase(1000, 10)).toBe(3);
    expect(logBase(8, 2)).toBe(3);
    expect(logBase(Math.E, Math.E)).toBe(1);
    expect(logBase(50, 10)).toBeCloseTo(1.69897, 5);
    expect(logBase(-1, 10)).toBeNaN();
    expect(logBase(10, 1)).toBeNaN();
  });
  it('computes roots, including odd roots of negatives', () => {
    expect(nthRoot(144, 2)).toBe(12);
    expect(nthRoot(27, 3)).toBe(3);
    expect(nthRoot(-27, 3)).toBe(-3);
    expect(nthRoot(-16, 2)).toBeNaN();
    expect(nthRoot(2, 2)).toBeCloseTo(1.41421356, 8);
  });
  it('simplifies radicals', () => {
    expect(simplifyRadical(72)).toEqual({ outside: 6, inside: 2 });
    expect(simplifyRadical(50)).toEqual({ outside: 5, inside: 2 });
    expect(simplifyRadical(49)).toEqual({ outside: 7, inside: 1 });
    expect(simplifyRadical(54, 3)).toEqual({ outside: 3, inside: 2 });
  });
});
