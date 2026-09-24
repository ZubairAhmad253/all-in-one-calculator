import { describe, expect, it } from 'vitest';
import { CalcError, evaluate, formatResult } from './expression';

const ev = (s: string, angle: 'deg' | 'rad' = 'deg', ans = 0) => evaluate(s, { angle, ans });

describe('arithmetic', () => {
  it('follows the order of operations', () => {
    expect(ev('2+3*4')).toBe(14);
    expect(ev('(2+3)*4')).toBe(20);
    expect(ev('10-4-3')).toBe(3);
    expect(ev('100/10/5')).toBe(2);
    expect(ev('2^3^2')).toBe(512); // right-associative
    expect(ev('-2^2')).toBe(-4);
    expect(ev('(-2)^2')).toBe(4);
  });

  it('accepts display symbols and thousands separators', () => {
    expect(ev('6×7')).toBe(42);
    expect(ev('84÷2')).toBe(42);
    expect(ev('50−8')).toBe(42);
    expect(ev('1,000+1')).toBe(1001);
  });

  it('handles decimals and scientific notation', () => {
    expect(ev('.5+.25')).toBe(0.75);
    expect(ev('1.5E3')).toBe(1500);
    expect(ev('2E-3*1000')).toBeCloseTo(2, 12);
  });

  it('multiplies implicitly', () => {
    expect(ev('2(3+4)')).toBe(14);
    expect(ev('(1+2)(3+4)')).toBe(21);
    expect(ev('2π')).toBeCloseTo(2 * Math.PI, 12);
    expect(ev('3sqrt(16)')).toBe(12);
  });

  it('closes brackets left open at the end', () => {
    expect(ev('sqrt(16')).toBe(4);
    expect(ev('2*(3+4')).toBe(14);
  });
});

describe('percent', () => {
  it('adds or subtracts a percentage of the left side', () => {
    expect(ev('200+10%')).toBeCloseTo(220, 10);
    expect(ev('200-10%')).toBeCloseTo(180, 10);
    expect(ev('80-25%')).toBeCloseTo(60, 10);
  });

  it('is a plain /100 elsewhere', () => {
    expect(ev('50%')).toBe(0.5);
    expect(ev('200*10%')).toBeCloseTo(20, 10);
    expect(ev('10%*200')).toBeCloseTo(20, 10);
  });
});

describe('scientific functions', () => {
  it('uses degrees or radians', () => {
    expect(ev('sin(30)')).toBeCloseTo(0.5, 12);
    expect(ev('sin(pi/6)', 'rad')).toBeCloseTo(0.5, 12);
    expect(ev('cos(60)')).toBeCloseTo(0.5, 12);
    expect(ev('tan(45)')).toBeCloseTo(1, 12);
  });

  it('gives exact values at multiples of 90 degrees', () => {
    expect(ev('sin(180)')).toBe(0);
    expect(ev('cos(90)')).toBe(0);
    expect(ev('sin(-90)')).toBe(-1);
    expect(ev('tan(180)')).toBe(0);
    expect(() => ev('tan(90)')).toThrow(CalcError);
    expect(() => ev('tan(270)')).toThrow(CalcError);
  });

  it('returns inverse trig in the current angle mode', () => {
    expect(ev('asin(0.5)')).toBeCloseTo(30, 10);
    expect(ev('atan(1)', 'rad')).toBeCloseTo(Math.PI / 4, 12);
    expect(() => ev('acos(2)')).toThrow(CalcError);
  });

  it('computes logs, roots and powers', () => {
    expect(ev('log(1000)')).toBeCloseTo(3, 12);
    expect(ev('ln(e)')).toBe(1);
    expect(ev('sqrt(2)^2')).toBeCloseTo(2, 12);
    expect(ev('cbrt(-27)')).toBe(-3);
    expect(ev('abs(-5)')).toBe(5);
    expect(ev('exp(1)')).toBeCloseTo(Math.E, 12);
  });

  it('computes factorials', () => {
    expect(ev('5!')).toBe(120);
    expect(ev('0!')).toBe(1);
    expect(ev('3!!')).toBe(720);
    expect(() => ev('2.5!')).toThrow(CalcError);
    expect(() => ev('171!')).toThrow(CalcError);
  });

  it('substitutes the previous answer', () => {
    expect(ev('ans*2', 'deg', 21)).toBe(42);
  });
});

describe('errors', () => {
  it.each([
    ['', 'Empty expression'],
    ['1/0', 'divide by zero'],
    ['2+', 'Incomplete'],
    ['sqrt(-1)', 'Not a real number'],
    ['ln(0)', 'Logarithm'],
    ['foo(2)', 'Unknown'],
    ['2)', 'Unexpected'],
    ['sin 30', 'Use brackets'],
    ['2 # 3', 'Unexpected'],
    ['10^400', 'too large'],
    ['2E', 'exponent'],
    ['2E+', 'exponent'],
  ])('rejects %j', (input, message) => {
    expect(() => ev(input)).toThrow(message);
  });

  it('never runs input as code', () => {
    expect(() => ev('alert(1)')).toThrow(CalcError);
    expect(() => ev('constructor')).toThrow(CalcError);
  });
});

describe('formatResult', () => {
  it('removes floating-point noise', () => {
    expect(formatResult(0.1 + 0.2)).toBe('0.3');
    expect(formatResult(1 - 0.9)).toBe('0.1');
    expect(formatResult(ev('sin(pi)', 'rad'))).toBe('0');
    expect(formatResult(ev('cos(pi/2)', 'rad'))).toBe('0');
  });

  it('groups thousands and switches to E notation at the extremes', () => {
    expect(formatResult(1234567.891)).toBe('1,234,567.891');
    expect(formatResult(1e20)).toBe('1E20');
    expect(formatResult(6.02214076e23)).toBe('6.02214076E23');
    expect(formatResult(1.5e-12)).toBe('1.5E-12');
  });
});
