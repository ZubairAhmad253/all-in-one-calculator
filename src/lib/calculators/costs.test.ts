import { describe, expect, it } from 'vitest';
import { dailyKwh, energyCost, pricePerUnit, splitByItems, tripFuel } from './costs';

describe('trip fuel', () => {
  it('works out litres and cost', () => {
    const t = tripFuel(500, 12.5, 1.8)!;
    expect(t.litres).toBe(40);
    expect(t.cost).toBeCloseTo(72, 10);
    expect(t.costPerKm).toBeCloseTo(0.144, 10);
    expect(tripFuel(100, 0, 1)).toBeNull();
  });
});

describe('electricity', () => {
  it('adds up appliance energy and cost', () => {
    expect(dailyKwh({ watts: 2000, hoursPerDay: 1.5, quantity: 1 })).toBe(3);
    const r = energyCost(
      [
        { watts: 150, hoursPerDay: 24, quantity: 1 },
        { watts: 10, hoursPerDay: 5, quantity: 6 },
      ],
      0.2,
    );
    expect(r.kwh.day).toBeCloseTo(3.9, 10);
    expect(r.kwh.year).toBeCloseTo(1423.5, 10);
    expect(r.cost.year).toBeCloseTo(284.7, 10);
  });
});

describe('unit price and split bill', () => {
  it('computes price per unit', () => {
    expect(pricePerUnit(4.5, 750)).toBeCloseTo(0.006, 12);
    expect(pricePerUnit(1, 0)).toBeNaN();
  });
  it('shares tax and tip in proportion', () => {
    const r = splitByItems([{ subtotal: 30 }, { subtotal: 20 }], 10, 10, 15);
    expect(r.itemsTotal).toBe(60);
    expect(r.total).toBe(75);
    expect(r.each[0].base).toBe(35);
    expect(r.each[0].total).toBeCloseTo(43.75, 10);
    expect(r.each[1].total).toBeCloseTo(31.25, 10);
  });
});
