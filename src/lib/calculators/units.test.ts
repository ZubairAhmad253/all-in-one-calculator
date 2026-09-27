import { describe, expect, it } from 'vitest';
import { LENGTH, QUANTITIES, TEMPERATURE, WEIGHT, belowMinimum, convert, formatValue, joinCompound, splitCompound } from './units';

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

describe('more quantities', () => {
  const c = (q: string, v: number, from: string, to: string) => convert(QUANTITIES[q], v, from, to);
  it('converts area', () => {
    expect(c('area', 1, 'ac', 'ft2')).toBeCloseTo(43_560, 6);
    expect(c('area', 1, 'ha', 'ac')).toBeCloseTo(2.4710538, 6);
    expect(c('area', 1, 'm2', 'ft2')).toBeCloseTo(10.7639104, 6);
    expect(c('area', 1, 'mi2', 'ac')).toBeCloseTo(640, 6);
  });
  it('converts volume', () => {
    expect(c('volume', 1, 'gal', 'l')).toBeCloseTo(3.785411784, 12);
    expect(c('volume', 1, 'gal', 'in3')).toBeCloseTo(231, 9);
    expect(c('volume', 1, 'cup', 'floz')).toBeCloseTo(8, 12);
    expect(c('volume', 1, 'tbsp', 'tsp')).toBeCloseTo(3, 12);
    expect(c('volume', 1, 'pt-uk', 'floz-uk')).toBeCloseTo(20, 12);
    expect(c('volume', 1, 'ft3', 'l')).toBeCloseTo(28.316846592, 9);
  });
  it('converts speed, time, data and pressure', () => {
    expect(c('speed', 100, 'kph', 'mph')).toBeCloseTo(62.1371192, 6);
    expect(c('speed', 1, 'kn', 'kph')).toBeCloseTo(1.852, 12);
    expect(c('time', 1, 'yr', 'd')).toBeCloseTo(365.2425, 9);
    expect(c('time', 1, 'wk', 'h')).toBe(168);
    expect(c('data', 1, 'gib', 'mb')).toBeCloseTo(1073.741824, 9);
    expect(c('data', 100, 'mbit', 'mb')).toBe(12.5);
    expect(c('pressure', 1, 'bar', 'psi')).toBeCloseTo(14.5037738, 6);
    expect(c('pressure', 1, 'atm', 'mmhg')).toBeCloseTo(760, 3); // mmHg is 133.322387415 Pa, not exactly 1 torr
    expect(c('pressure', 1, 'atm', 'torr')).toBeCloseTo(760, 9);
  });
});

describe('energy', () => {
  const c = (v: number, from: string, to: string) => convert(QUANTITIES.energy, v, from, to);
  it('uses standard definitions', () => {
    expect(c(1, 'kcal', 'kj')).toBeCloseTo(4.184, 12);
    expect(c(1, 'kwh', 'mj')).toBeCloseTo(3.6, 12);
    expect(c(1, 'kwh', 'btu')).toBeCloseTo(3412.14, 2);
    expect(c(1, 'therm', 'btu')).toBeCloseTo(99_976.1, 0);
    expect(c(2000, 'kcal', 'kwh')).toBeCloseTo(2.32444, 5);
  });
});

describe('fuel economy', () => {
  const c = (v: number, from: string, to: string) => convert(QUANTITIES.fuel, v, from, to);
  it('handles the inverse relationship with L/100 km', () => {
    expect(c(30, 'mpg', 'l100')).toBeCloseTo(7.84049, 5);
    expect(c(5, 'l100', 'mpg')).toBeCloseTo(47.0429, 4);
    expect(c(5, 'l100', 'mpg-uk')).toBeCloseTo(56.4962, 4);
    expect(c(10, 'kmpl', 'l100')).toBeCloseTo(10, 12);
    expect(c(1, 'mpg', 'mpg-uk')).toBeCloseTo(1.20095, 5);
    expect(c(7, 'l100', 'l100')).toBe(7);
  });
});
