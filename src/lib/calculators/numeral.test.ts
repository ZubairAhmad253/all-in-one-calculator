import { describe, expect, it } from 'vitest';
import { fromRoman, groupDigits, parseInBase, toBase, toRoman } from './numeral';

describe('bases', () => {
  it('parses numbers in any base', () => {
    expect(parseInBase('ff', 16)).toBe(255n);
    expect(parseInBase('0xFF', 16)).toBe(255n);
    expect(parseInBase('1111 1111', 2)).toBe(255n);
    expect(parseInBase('-777', 8)).toBe(-511n);
    expect(parseInBase('z', 36)).toBe(35n);
    expect(parseInBase('12', 2)).toBeNull();
    expect(parseInBase('', 10)).toBeNull();
  });
  it('writes numbers in any base, exactly', () => {
    expect(toBase(255n, 2)).toBe('11111111');
    expect(toBase(255n, 16)).toBe('ff');
    expect(toBase(-10n, 2)).toBe('-1010');
    expect(toBase(0n, 8)).toBe('0');
    expect(toBase(2n ** 64n, 16)).toBe('10000000000000000');
  });
  it('groups digits from the right', () => {
    expect(groupDigits('1010101', 4)).toBe('101 0101');
    expect(groupDigits('-11111111', 4)).toBe('-1111 1111');
  });
});

describe('roman numerals', () => {
  it('converts numbers to numerals', () => {
    expect(toRoman(1994)!.numeral).toBe('MCMXCIV');
    expect(toRoman(2026)!.numeral).toBe('MMXXVI');
    expect(toRoman(3999)!.numeral).toBe('MMMCMXCIX');
    expect(toRoman(4)!.parts).toEqual([{ value: 4, symbol: 'IV' }]);
    expect(toRoman(0)).toBeNull();
    expect(toRoman(4000)).toBeNull();
  });
  it('reads standard numerals and rejects others', () => {
    expect(fromRoman('mcmxciv')).toEqual({ value: 1994 });
    expect(fromRoman('XLII')).toEqual({ value: 42 });
    expect(fromRoman('IIII')).toHaveProperty('error');
    expect(fromRoman('IC')).toHaveProperty('error');
    expect(fromRoman('ABC')).toHaveProperty('error');
  });
});
