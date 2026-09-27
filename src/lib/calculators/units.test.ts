import { describe, expect, it } from 'vitest';
import { LENGTH, TEMPERATURE, WEIGHT, belowMinimum, convert, formatValue, joinCompound, splitCompound } from './units';

describe('length', () => {
  it('uses exact definitions', () => {
    expect(convert(LENGTH, 1, 'in', 'cm')).toBeCloseTo(2.54, 12);
    expect(convert(LENGTH, 1, 'ft', 'm')).toBeCloseTo(0.3048, 12);
    expect(convert(LENGTH, 1, 'yd', 'm')).toBeCloseTo(0.9144, 12);
    expect(convert(LENGTH, 1, 'mi', 'km')).toBeCloseTo(1.609344, 12);
    expect(convert(LENGTH, 1, 'nmi', 'm')).toBe(1852);
  });

  it('converts between any two units and back', () => {
    expect(convert(LENGTH, 1, 'mi', 'ft')).toBeCloseTo(5280, 9);
    expect(convert(LENGTH, 100, 'm', 'yd')).toBeCloseTo(109.3613298, 6);
    const there = convert(LENGTH, 123.456, 'km', 'in');
    expect(convert(LENGTH, there, 'in', 'km')).toBeCloseTo(123.456, 9);
  });

  it('returns the same value for the same unit, NaN for unknown units', () => {
    expect(convert(LENGTH, 7, 'cm', 'cm')).toBe(7);
    expect(convert(LENGTH, 7, 'cm', 'parsec')).toBeNaN();
  });
});

describe('weight', () => {
  it('uses exact definitions', () => {
    expect(convert(WEIGHT, 1, 'lb', 'kg')).toBeCloseTo(0.45359237, 12);
    expect(convert(WEIGHT, 1, 'oz', 'g')).toBeCloseTo(28.349523125, 9);
    expect(convert(WEIGHT, 1, 'st', 'lb')).toBeCloseTo(14, 12);
    expect(convert(WEIGHT, 1, 'ton-us', 'lb')).toBeCloseTo(2000, 9);
    expect(convert(WEIGHT, 1, 'ton-uk', 'kg')).toBeCloseTo(1016.0469088, 6);
    expect(convert(WEIGHT, 1, 'kg', 'lb')).toBeCloseTo(2.20462262, 7);
  });
});

describe('temperature', () => {
  it('converts the standard reference points', () => {
    expect(convert(TEMPERATURE, 0, 'c', 'f')).toBeCloseTo(32, 10);
    expect(convert(TEMPERATURE, 100, 'c', 'f')).toBeCloseTo(212, 10);
    expect(convert(TEMPERATURE, 37, 'c', 'f')).toBeCloseTo(98.6, 10);
    expect(convert(TEMPERATURE, -40, 'c', 'f')).toBeCloseTo(-40, 10);
    expect(convert(TEMPERATURE, 0, 'k', 'c')).toBeCloseTo(-273.15, 10);
    expect(convert(TEMPERATURE, 350, 'f', 'c')).toBeCloseTo(176.6667, 4);
  });

  it('flags values below absolute zero', () => {
    expect(belowMinimum(TEMPERATURE, -274, 'c')).toBe(true);
    expect(belowMinimum(TEMPERATURE, -273.15, 'c')).toBe(false);
    expect(belowMinimum(TEMPERATURE, -460, 'f')).toBe(true);
    expect(belowMinimum(TEMPERATURE, -1, 'k')).toBe(true);
    expect(belowMinimum(LENGTH, -1, 'm')).toBe(false);
  });
});

describe('compound units', () => {
  const ftin = LENGTH.compound!;
  const stlb = WEIGHT.compound!;

  it('splits and joins', () => {
    expect(splitCompound(ftin, 5.75)).toEqual({ major: 5, minor: 9, sign: 1 });
    expect(joinCompound(ftin, 5, 9)).toBe(5.75);
    expect(splitCompound(stlb, 11.5)).toEqual({ major: 11, minor: 7, sign: 1 });
  });

  it('carries a rounded-up remainder into the major unit', () => {
    // 5.999 ft = 5 ft 11.988 in, which rounds to 12.0 in → 6 ft 0 in.
    expect(splitCompound(ftin, 5.999)).toEqual({ major: 6, minor: 0, sign: 1 });
  });

  it('matches a real height', () => {
    const ft = convert(LENGTH, 175, 'cm', 'ft');
    expect(splitCompound(ftin, ft)).toEqual({ major: 5, minor: 8.9, sign: 1 });
  });
});

describe('formatValue', () => {
  it('removes floating-point noise and groups digits', () => {
    expect(formatValue(0.1 * 3)).toBe('0.3');
    expect(formatValue(1_609_344)).toBe('1,609,344');
    expect(formatValue(3.280839895013123)).toBe('3.280839895');
  });

  it('uses E notation at the extremes', () => {
    expect(formatValue(1e-9)).toBe('1E-9');
    expect(formatValue(5e20)).toBe('5E20');
    expect(formatValue(Number.NaN)).toBe('—');
  });
});
