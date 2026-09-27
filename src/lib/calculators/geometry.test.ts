import { describe, expect, it } from 'vitest';
import { circleFrom, lineThrough, pythagoras, pythagoreanTriples, SHAPES_2D, SHAPES_3D, solveAAS, solveSAS, solveSSA, solveSSS } from './geometry';

describe('pythagoras', () => {
  it('finds the hypotenuse or a missing leg', () => {
    expect(pythagoras(3, 4, NaN)!.c).toBe(5);
    expect(pythagoras(NaN, 12, 13)!.a).toBe(5);
    expect(pythagoras(8, NaN, 17)!.b).toBe(15);
    const t = pythagoras(3, 4, NaN)!;
    expect(t.area).toBe(6);
    expect(t.height).toBe(2.4);
    expect(t.angleA).toBeCloseTo(36.8699, 4);
  });
  it('rejects impossible input', () => {
    expect(pythagoras(5, NaN, 4)).toBeNull();
    expect(pythagoras(NaN, NaN, 4)).toBeNull();
  });
  it('lists triples', () => {
    expect(pythagoreanTriples(13)).toEqual([
      [3, 4, 5],
      [6, 8, 10],
      [5, 12, 13],
    ]);
  });
});

describe('triangle solving', () => {
  it('solves SSS and classifies', () => {
    const t = solveSSS(3, 4, 5)!;
    expect(t.C).toBeCloseTo(90, 10);
    expect(t.area).toBeCloseTo(6, 10);
    expect(t.angleType).toBe('right');
    expect(t.sideType).toBe('scalene');
    expect(t.inradius).toBeCloseTo(1, 10);
    expect(t.circumradius).toBeCloseTo(2.5, 10);
    expect(solveSSS(2, 2, 2)!.sideType).toBe('equilateral');
    expect(solveSSS(1, 2, 3)).toBeNull();
  });
  it('solves SAS and AAS', () => {
    const t = solveSAS(5, 7, 60)!;
    expect(t.c).toBeCloseTo(Math.sqrt(39), 10);
    const u = solveAAS(30, 60, 1, 'a')!;
    expect(u.c).toBeCloseTo(2, 10);
    expect(u.b).toBeCloseTo(Math.sqrt(3), 10);
    expect(solveAAS(100, 90, 1, 'a')).toBeNull();
  });
  it('handles the ambiguous SSA case', () => {
    expect(solveSSA(6, 8, 35)).toHaveLength(2);
    expect(solveSSA(10, 8, 35)).toHaveLength(1);
    expect(solveSSA(3, 8, 35)).toHaveLength(0);
    expect(solveSSA(4, 8, 30)).toHaveLength(1); // exactly a right triangle
  });
});

describe('circles, areas and volumes', () => {
  it('builds a circle from any measurement', () => {
    expect(circleFrom('r', 5)!.area).toBeCloseTo(78.5398, 4);
    expect(circleFrom('C', 2 * Math.PI)!.radius).toBeCloseTo(1, 12);
    expect(circleFrom('A', Math.PI * 9)!.diameter).toBeCloseTo(6, 12);
    expect(circleFrom('d', 0)).toBeNull();
  });
  it('computes 2D areas', () => {
    expect(SHAPES_2D.trapezoid.area({ a: 4, b: 6, h: 3 })).toBe(15);
    expect(SHAPES_2D.rectangle.perimeter!({ l: 4, w: 3 })).toBe(14);
    expect(SHAPES_2D.ellipse.perimeter!({ a: 1, b: 1 })).toBeCloseTo(2 * Math.PI, 10);
  });
  it('computes 3D volumes and surfaces', () => {
    expect(SHAPES_3D.sphere.volume({ r: 3 })).toBeCloseTo(113.0973, 4);
    expect(SHAPES_3D.box.surface({ l: 2, w: 3, h: 4 })).toBe(52);
    expect(SHAPES_3D.cone.surface({ r: 3, h: 4 })).toBeCloseTo(24 * Math.PI, 10);
  });
});

describe('lines', () => {
  it('finds slope, distance and intercepts', () => {
    const l = lineThrough(1, 2, 4, 8)!;
    expect(l.slope).toBe(2);
    expect(l.intercept).toBe(0);
    expect(l.distance).toBeCloseTo(Math.sqrt(45), 12);
    expect(l.midpoint).toEqual([2.5, 5]);
    expect(lineThrough(2, 1, 2, 5)!.vertical).toBe(true);
    expect(lineThrough(1, 1, 1, 1)).toBeNull();
  });
});
