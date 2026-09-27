import { describe, expect, it } from 'vitest';
import { bricks, concreteVolume, CONCRETE_BAGS, flooring, paint, pitchDegrees, pitchFactor, roof, tiles, tins, wallpaper } from './build';

describe('paint', () => {
  it('works out wall area, openings and litres', () => {
    const p = paint({ length: 4, width: 3.5, height: 2.4, doors: 1, windows: 1, coats: 2, includeCeiling: false, coverage: 10 })!;
    expect(p.walls).toBeCloseTo(36, 10);
    expect(p.wallArea).toBeCloseTo(32.6, 10);
    expect(p.litres).toBeCloseTo(6.52, 10);
  });
  it('picks tins', () => {
    expect(tins(6.52, [5, 2.5, 1])).toEqual([
      { size: 5, count: 1 },
      { size: 2.5, count: 1 },
    ]);
    expect(tins(4.2, [5, 2.5, 1])).toEqual([{ size: 5, count: 1 }]);
    expect(tins(0.8, [5, 2.5, 1])).toEqual([{ size: 1, count: 1 }]);
    expect(tins(2.17, [5, 1, 0.25])).toEqual([
      { size: 1, count: 2 },
      { size: 0.25, count: 1 },
    ]);
  });
});

describe('tiles and flooring', () => {
  it('counts tiles with grout and waste', () => {
    const t = tiles({ area: 12, tileLength: 0.3, tileWidth: 0.3, grout: 0, wastePct: 10, perBox: 10 })!;
    expect(t.exact).toBeCloseTo(133.33, 2);
    expect(t.count).toBe(147);
    expect(t.boxes).toBe(15);
  });
  it('rounds flooring up to whole boxes', () => {
    const f = flooring(20, 10, 2.2, 25)!;
    expect(f.buy).toBeCloseTo(22, 10);
    expect(f.boxes).toBe(10);
    expect(f.cost).toBeCloseTo(550, 10);
  });
});

describe('concrete', () => {
  it('computes slab, column and tube volumes', () => {
    expect(concreteVolume('slab', 3, 3, 0.1)).toBeCloseTo(0.9, 12);
    expect(concreteVolume('column', 0.3, 2, 0)).toBeCloseTo(0.141372, 6);
    expect(concreteVolume('tube', 0.4, 0.2, 1)).toBeCloseTo(0.0942478, 6);
    expect(concreteVolume('tube', 0.2, 0.3, 1)).toBeNaN();
  });
  it('knows bag yields', () => {
    expect(CONCRETE_BAGS[0].yield).toBeCloseTo(0.0169901, 6);
  });
});

describe('bricks, roofing and wallpaper', () => {
  it('counts bricks per square metre', () => {
    const b = bricks(10, 'uk', 0.01, 5)!;
    expect(b.perM2).toBeCloseTo(59.26, 2);
    expect(b.count).toBe(623);
  });
  it('scales roof area by pitch', () => {
    expect(pitchFactor(12)).toBeCloseTo(Math.SQRT2, 12);
    expect(pitchDegrees(6)).toBeCloseTo(26.565, 3);
    const r = roof(10, 8, 0, 6, 0)!;
    expect(r.area).toBeCloseTo(89.4427, 4);
    expect(r.squares).toBeCloseTo(9.6275, 3);
    expect(r.bundles).toBe(29);
  });
  it('counts wallpaper drops and rolls', () => {
    const w = wallpaper({ perimeter: 15, height: 2.4, rollLength: 10.05, rollWidth: 0.53, repeat: 0, openingsWidth: 0, wastePct: 0 })!;
    expect(w.dropsPerRoll).toBe(4);
    expect(w.drops).toBe(29);
    expect(w.rolls).toBe(8);
    const p = wallpaper({ perimeter: 15, height: 2.4, rollLength: 10.05, rollWidth: 0.53, repeat: 0.64, openingsWidth: 0, wastePct: 0 })!;
    expect(p.drop).toBeCloseTo(2.56, 12);
    expect(p.dropsPerRoll).toBe(3);
    expect(p.rolls).toBe(10);
  });
});
