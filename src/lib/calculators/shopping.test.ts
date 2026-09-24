import { describe, expect, it } from 'vitest';
import { discount, salesTax, tip } from './shopping';

describe('salesTax', () => {
  it('adds tax to a net price', () => {
    expect(salesTax(100, 20, 'add')).toEqual({ net: 100, tax: 20, gross: 120 });
    const r = salesTax(49.99, 8.25, 'add');
    expect(r.tax).toBeCloseTo(4.124, 3);
    expect(r.gross).toBeCloseTo(54.114, 3);
  });

  it('removes tax from a tax-inclusive price', () => {
    const r = salesTax(120, 20, 'remove');
    expect(r.net).toBeCloseTo(100, 10);
    expect(r.tax).toBeCloseTo(20, 10);
    expect(r.gross).toBe(120);
  });

  it('round-trips add then remove', () => {
    const gross = salesTax(73.5, 7.5, 'add').gross;
    expect(salesTax(gross, 7.5, 'remove').net).toBeCloseTo(73.5, 10);
  });

  it('treats negative or empty input as zero', () => {
    expect(salesTax(-5, 10, 'add').gross).toBe(0);
    expect(salesTax(100, -10, 'add').gross).toBe(100);
    expect(salesTax(Number.NaN, 10, 'add').gross).toBe(0);
  });
});

describe('discount', () => {
  it('takes a percentage off', () => {
    const r = discount({ price: 80, type: 'percent', value: 25 });
    expect(r.salePrice).toBe(60);
    expect(r.savings).toBe(20);
    expect(r.totalPct).toBe(25);
  });

  it('takes a fixed amount off', () => {
    const r = discount({ price: 80, type: 'amount', value: 15 });
    expect(r.salePrice).toBe(65);
    expect(r.totalPct).toBeCloseTo(18.75, 10);
  });

  it('stacks an extra percentage on the reduced price, not the original', () => {
    // 30% off, then an extra 20% off: 44% in total, not 50%.
    const r = discount({ price: 100, type: 'percent', value: 30, extraPct: 20 });
    expect(r.afterFirst).toBe(70);
    expect(r.salePrice).toBeCloseTo(56, 10);
    expect(r.totalPct).toBeCloseTo(44, 10);
  });

  it('never goes below zero', () => {
    expect(discount({ price: 50, type: 'amount', value: 80 }).salePrice).toBe(0);
    expect(discount({ price: 50, type: 'percent', value: 150 }).salePrice).toBe(0);
  });
});

describe('tip', () => {
  it('works out tip and total', () => {
    const r = tip({ bill: 85, tipPct: 18, people: 1 });
    expect(r.tip).toBeCloseTo(15.3, 10);
    expect(r.total).toBeCloseTo(100.3, 10);
  });

  it('splits between people', () => {
    const r = tip({ bill: 120, tipPct: 20, people: 4 });
    expect(r.totalPerPerson).toBeCloseTo(36, 10);
    expect(r.tipPerPerson).toBeCloseTo(6, 10);
  });

  it('rounds each share up to a whole unit', () => {
    // $85 + 18% = $100.30 over 3 people = $33.43 each, rounded up to $34.
    const r = tip({ bill: 85, tipPct: 18, people: 3, rounding: 'person' });
    expect(r.totalPerPerson).toBe(34);
    expect(r.total).toBe(102);
    expect(r.tip).toBe(17);
    expect(r.effectivePct).toBeCloseTo(20, 10);
  });

  it('rounds the whole bill up to a whole unit', () => {
    const r = tip({ bill: 85, tipPct: 18, people: 3, rounding: 'total' });
    expect(r.total).toBe(101);
    expect(r.tip).toBe(16);
  });

  it('does not round up an amount that is already whole', () => {
    // 100 × 1.1 is 110.00000000000001 in floating point; it must stay 110.
    expect(tip({ bill: 100, tipPct: 10, people: 1, rounding: 'total' }).total).toBe(110);
    expect(tip({ bill: 100, tipPct: 10, people: 2, rounding: 'person' }).totalPerPerson).toBe(55);
  });

  it('treats 0 or fractional people as at least one whole person', () => {
    expect(tip({ bill: 50, tipPct: 10, people: 0 }).totalPerPerson).toBeCloseTo(55, 10);
    expect(tip({ bill: 50, tipPct: 10, people: 2.7 }).totalPerPerson).toBeCloseTo(27.5, 10);
  });
});
