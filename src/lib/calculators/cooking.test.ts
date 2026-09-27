import { describe, expect, it } from 'vitest';
import { convertKitchen } from './cooking';

describe('kitchen conversions', () => {
  it('converts volumes and weights directly', () => {
    expect(convertKitchen(1, 'cup', 'tbsp', 'water')).toBeCloseTo(16, 12);
    expect(convertKitchen(1, 'tbsp', 'tsp', 'flour')).toBeCloseTo(3, 12);
    expect(convertKitchen(1, 'lb', 'g', 'sugar')).toBeCloseTo(453.59237, 9);
    expect(convertKitchen(1, 'cup-metric', 'ml', 'milk')).toBe(250);
  });
  it('uses ingredient density between volume and weight', () => {
    expect(convertKitchen(1, 'cup', 'g', 'flour')).toBeCloseTo(120, 9);
    expect(convertKitchen(2, 'cup', 'g', 'sugar')).toBeCloseTo(400, 9);
    expect(convertKitchen(100, 'g', 'cup', 'butter')).toBeCloseTo(100 / 227, 9);
    expect(convertKitchen(1, 'tbsp', 'g', 'butter')).toBeCloseTo(14.1875, 4);
  });
  it('rejects unknown units', () => {
    expect(convertKitchen(1, 'bucket', 'g', 'water')).toBeNaN();
  });
});
