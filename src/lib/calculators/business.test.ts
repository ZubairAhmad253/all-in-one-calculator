import { describe, expect, it } from 'vitest';
import { breakEven, depreciation, irr, margin, marginToMarkup, markupToMargin, npv, payback, priceForMargin, priceForMarkup, presentValues } from './business';

describe('margin and markup', () => {
  it('computes margin and markup from cost and price', () => {
    const r = margin(60, 100);
    expect(r.profit).toBe(40);
    expect(r.marginPct).toBe(40);
    expect(r.markupPct).toBeCloseTo(66.667, 3);
  });

  it('finds prices for a target margin or markup', () => {
    expect(priceForMargin(60, 40)).toBeCloseTo(100, 10);
    expect(priceForMarkup(60, 50)).toBe(90);
    expect(priceForMargin(60, 100)).toBeNaN();
  });

  it('converts between markup and margin', () => {
    expect(markupToMargin(50)).toBeCloseTo(33.333, 3);
    expect(markupToMargin(100)).toBe(50);
    expect(marginToMarkup(50)).toBe(100);
    expect(marginToMarkup(markupToMargin(37))).toBeCloseTo(37, 10);
  });
});

describe('breakEven', () => {
  it('finds the units and revenue needed', () => {
    // $10,000 fixed, $50 price, $30 variable → 500 units, $25,000.
    const r = breakEven(10_000, 50, 30);
    expect(r.contribution).toBe(20);
    expect(r.contributionRatio).toBe(40);
    expect(r.units).toBe(500);
    expect(r.revenue).toBe(25_000);
  });

  it('rounds up to whole units and includes a target profit', () => {
    expect(breakEven(10_000, 50, 35).units).toBe(667); // 666.67
    expect(breakEven(10_000, 50, 30, 5_000).units).toBe(750);
  });

  it('is impossible when price doesn’t cover variable cost', () => {
    expect(breakEven(10_000, 30, 30).possible).toBe(false);
  });
});

describe('depreciation', () => {
  it('straight-line spreads the cost evenly', () => {
    const rows = depreciation(10_000, 1_000, 5, 'straight');
    expect(rows.map((r) => r.depreciation)).toEqual([1_800, 1_800, 1_800, 1_800, 1_800]);
    expect(rows.at(-1)!.end).toBeCloseTo(1_000, 8);
  });

  it('double-declining starts at 2 ÷ life and ends at salvage', () => {
    const rows = depreciation(10_000, 1_000, 5, 'double');
    expect(rows[0].depreciation).toBe(4_000); // 40% of 10,000
    expect(rows[1].depreciation).toBe(2_400); // 40% of 6,000
    expect(rows.at(-1)!.end).toBeCloseTo(1_000, 8);
    expect(rows.every((r) => r.end >= 1_000 - 1e-9)).toBe(true);
    expect(rows.at(-1)!.accumulated).toBeCloseTo(9_000, 8);
  });

  it('150% declining balance also finishes at salvage', () => {
    const rows = depreciation(10_000, 500, 8, 'declining');
    expect(rows[0].depreciation).toBeCloseTo(1_875, 8); // 18.75%
    expect(rows.at(-1)!.end).toBeCloseTo(500, 8);
  });
});

describe('npv / irr', () => {
  const flows = [3_000, 4_000, 4_000, 3_000];

  it('discounts cash flows', () => {
    // −10,000 + 3,000/1.1 + 4,000/1.21 + 4,000/1.331 + 3,000/1.4641
    expect(npv(10, 10_000, flows)).toBeCloseTo(1_087.36, 2); // 2,727.27 + 3,305.79 + 3,005.26 + 2,049.04 − 10,000
    expect(presentValues(10, [1_100])[0]).toBeCloseTo(1_000, 8);
  });

  it('finds the IRR where NPV is zero', () => {
    const r = irr(10_000, flows);
    expect(npv(r, 10_000, flows)).toBeCloseTo(0, 4);
    expect(r).toBeCloseTo(14.9, 1);
  });

  it('returns NaN when there is no IRR', () => {
    expect(irr(10_000, [100, 100])).toBeLessThan(0); // never repaid: negative IRR exists
    expect(irr(0, [100, 100])).toBeNaN();
  });

  it('computes simple and discounted payback', () => {
    expect(payback(10_000, flows)).toBeCloseTo(2.75, 10); // 3,000 + 4,000 + 3,000 of the 3rd year's 4,000
    expect(payback(10_000, flows, 10)).toBeGreaterThan(2.75);
    expect(payback(10_000, [1_000, 1_000])).toBe(Infinity);
  });
});
