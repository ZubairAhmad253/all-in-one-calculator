/**
 * Geometry: right triangles, general triangle solving, circles, 2D areas,
 * 3D volumes and lines through two points. Angles are in degrees.
 * Pure functions only.
 */

const RAD = Math.PI / 180;
const sinD = (d: number) => Math.sin(d * RAD);
const cosD = (d: number) => Math.cos(d * RAD);
const acosD = (x: number) => Math.acos(Math.min(1, Math.max(-1, x))) / RAD;
const asinD = (x: number) => Math.asin(Math.min(1, Math.max(-1, x))) / RAD;
const pos = (...xs: number[]) => xs.every((x) => Number.isFinite(x) && x > 0);

// ------------------------------------------------------- right triangles

export interface RightTriangle {
  a: number;
  b: number;
  c: number;
  /** Angle opposite a, and opposite b. */
  angleA: number;
  angleB: number;
  area: number;
  perimeter: number;
  /** Altitude from the right angle to the hypotenuse. */
  height: number;
}

/**
 * Solve a right triangle from any two of the legs a, b and hypotenuse c
 * (pass NaN for the unknown). Returns null if the sides can't form one.
 */
export function pythagoras(a: number, b: number, c: number): RightTriangle | null {
  if (pos(a, b)) c = Math.hypot(a, b);
  else if (pos(a, c)) {
    if (c <= a) return null;
    b = Math.sqrt(c * c - a * a);
  } else if (pos(b, c)) {
    if (c <= b) return null;
    a = Math.sqrt(c * c - b * b);
  } else return null;
  return {
    a,
    b,
    c,
    angleA: asinD(a / c),
    angleB: asinD(b / c),
    area: (a * b) / 2,
    perimeter: a + b + c,
    height: (a * b) / c,
  };
}

/** Whole-number Pythagorean triples with hypotenuse up to `max`. */
export function pythagoreanTriples(max: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let c = 5; c <= max; c++)
    for (let a = 3; a < c / Math.SQRT2; a++) {
      const b = Math.sqrt(c * c - a * a);
      if (Number.isInteger(b)) out.push([a, b, c]);
    }
  return out;
}

// ------------------------------------------------------ general triangles

export interface Triangle {
  a: number;
  b: number;
  c: number;
  A: number;
  B: number;
  C: number;
  area: number;
  perimeter: number;
  /** Heights onto sides a, b and c. */
  ha: number;
  hb: number;
  hc: number;
  inradius: number;
  circumradius: number;
  sideType: 'equilateral' | 'isosceles' | 'scalene';
  angleType: 'right' | 'obtuse' | 'acute';
}

const close = (x: number, y: number) => Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y));

function finish(a: number, b: number, c: number): Triangle | null {
  if (!pos(a, b, c) || a + b <= c * (1 + 1e-12) || a + c <= b * (1 + 1e-12) || b + c <= a * (1 + 1e-12)) return null;
  const A = acosD((b * b + c * c - a * a) / (2 * b * c));
  const B = acosD((a * a + c * c - b * b) / (2 * a * c));
  const C = 180 - A - B;
  const s = (a + b + c) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
  const largest = Math.max(A, B, C);
  return {
    a,
    b,
    c,
    A,
    B,
    C,
    area,
    perimeter: 2 * s,
    ha: (2 * area) / a,
    hb: (2 * area) / b,
    hc: (2 * area) / c,
    inradius: area / s,
    circumradius: (a * b * c) / (4 * area),
    sideType: close(a, b) && close(b, c) ? 'equilateral' : close(a, b) || close(b, c) || close(a, c) ? 'isosceles' : 'scalene',
    angleType: Math.abs(largest - 90) < 1e-7 ? 'right' : largest > 90 ? 'obtuse' : 'acute',
  };
}

/** Three sides. */
export const solveSSS = (a: number, b: number, c: number) => finish(a, b, c);

/** Two sides and the angle between them (a, b, C). */
export function solveSAS(a: number, b: number, C: number): Triangle | null {
  if (!pos(a, b, C) || C >= 180) return null;
  return finish(a, b, Math.sqrt(a * a + b * b - 2 * a * b * cosD(C)));
}

/** Two angles and a side (A, B and side a opposite A, or any side). */
export function solveAAS(A: number, B: number, side: number, which: 'a' | 'b' | 'c'): Triangle | null {
  if (!pos(A, B, side) || A + B >= 180) return null;
  const C = 180 - A - B;
  const k = side / sinD(which === 'a' ? A : which === 'b' ? B : C);
  return finish(k * sinD(A), k * sinD(B), k * sinD(C));
}

/**
 * Two sides and a non-included angle (a, b, A): the ambiguous case.
 * Returns zero, one or two triangles.
 */
export function solveSSA(a: number, b: number, A: number): Triangle[] {
  if (!pos(a, b, A) || A >= 180) return [];
  const sinB = (b * sinD(A)) / a;
  if (sinB > 1 + 1e-12) return [];
  const B1 = asinD(sinB);
  const out: Triangle[] = [];
  for (const B of close(sinB, 1) ? [90] : [B1, 180 - B1]) {
    if (A + B >= 180 - 1e-9) continue;
    const t = solveAAS(A, B, a, 'a');
    if (t) out.push(t);
  }
  return out;
}

// ---------------------------------------------------------------- circles

export type CircleInput = 'r' | 'd' | 'C' | 'A';

export interface Circle {
  radius: number;
  diameter: number;
  circumference: number;
  area: number;
}

/** A circle from its radius, diameter, circumference or area. */
export function circleFrom(kind: CircleInput, value: number): Circle | null {
  if (!pos(value)) return null;
  const r = kind === 'r' ? value : kind === 'd' ? value / 2 : kind === 'C' ? value / (2 * Math.PI) : Math.sqrt(value / Math.PI);
  return { radius: r, diameter: 2 * r, circumference: 2 * Math.PI * r, area: Math.PI * r * r };
}

/** Arc length and sector area for a central angle in degrees. */
export const sector = (r: number, angle: number) => ({
  arc: 2 * Math.PI * r * (angle / 360),
  area: Math.PI * r * r * (angle / 360),
  chord: 2 * r * sinD(angle / 2),
});

// ------------------------------------------------------------- 2D shapes

export interface ShapeField {
  key: string;
  label: string;
}

export interface Shape2D {
  label: string;
  fields: ShapeField[];
  formula: string;
  area: (v: Record<string, number>) => number;
  perimeter?: (v: Record<string, number>) => number;
}

export const SHAPES_2D: Record<string, Shape2D> = {
  rectangle: {
    label: 'Rectangle',
    fields: [
      { key: 'l', label: 'Length' },
      { key: 'w', label: 'Width' },
    ],
    formula: 'A = l × w',
    area: ({ l, w }) => l * w,
    perimeter: ({ l, w }) => 2 * (l + w),
  },
  square: {
    label: 'Square',
    fields: [{ key: 's', label: 'Side' }],
    formula: 'A = s²',
    area: ({ s }) => s * s,
    perimeter: ({ s }) => 4 * s,
  },
  triangle: {
    label: 'Triangle',
    fields: [
      { key: 'b', label: 'Base' },
      { key: 'h', label: 'Height' },
    ],
    formula: 'A = ½ × b × h',
    area: ({ b, h }) => (b * h) / 2,
  },
  circle: {
    label: 'Circle',
    fields: [{ key: 'r', label: 'Radius' }],
    formula: 'A = πr²',
    area: ({ r }) => Math.PI * r * r,
    perimeter: ({ r }) => 2 * Math.PI * r,
  },
  trapezoid: {
    label: 'Trapezoid',
    fields: [
      { key: 'a', label: 'Top side (a)' },
      { key: 'b', label: 'Bottom side (b)' },
      { key: 'h', label: 'Height' },
    ],
    formula: 'A = ½ × (a + b) × h',
    area: ({ a, b, h }) => ((a + b) * h) / 2,
  },
  parallelogram: {
    label: 'Parallelogram',
    fields: [
      { key: 'b', label: 'Base' },
      { key: 'h', label: 'Height' },
    ],
    formula: 'A = b × h',
    area: ({ b, h }) => b * h,
  },
  ellipse: {
    label: 'Ellipse',
    fields: [
      { key: 'a', label: 'Semi-major axis (a)' },
      { key: 'b', label: 'Semi-minor axis (b)' },
    ],
    formula: 'A = πab',
    area: ({ a, b }) => Math.PI * a * b,
    // Ramanujan's approximation.
    perimeter: ({ a, b }) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))),
  },
  rhombus: {
    label: 'Rhombus',
    fields: [
      { key: 'p', label: 'Diagonal 1' },
      { key: 'q', label: 'Diagonal 2' },
    ],
    formula: 'A = (d₁ × d₂) ÷ 2',
    area: ({ p, q }) => (p * q) / 2,
    perimeter: ({ p, q }) => 2 * Math.hypot(p, q),
  },
  sector: {
    label: 'Circle sector',
    fields: [
      { key: 'r', label: 'Radius' },
      { key: 't', label: 'Angle (degrees)' },
    ],
    formula: 'A = πr² × θ ÷ 360',
    area: ({ r, t }) => sector(r, t).area,
    perimeter: ({ r, t }) => 2 * r + sector(r, t).arc,
  },
  hexagon: {
    label: 'Hexagon',
    fields: [{ key: 's', label: 'Side' }],
    formula: 'A = (3√3 ÷ 2) × s²',
    area: ({ s }) => ((3 * Math.sqrt(3)) / 2) * s * s,
    perimeter: ({ s }) => 6 * s,
  },
};

// ------------------------------------------------------------- 3D shapes

export interface Shape3D {
  label: string;
  fields: ShapeField[];
  formula: string;
  volume: (v: Record<string, number>) => number;
  surface: (v: Record<string, number>) => number;
}

export const SHAPES_3D: Record<string, Shape3D> = {
  cube: {
    label: 'Cube',
    fields: [{ key: 's', label: 'Edge length' }],
    formula: 'V = s³',
    volume: ({ s }) => s ** 3,
    surface: ({ s }) => 6 * s * s,
  },
  box: {
    label: 'Rectangular box',
    fields: [
      { key: 'l', label: 'Length' },
      { key: 'w', label: 'Width' },
      { key: 'h', label: 'Height' },
    ],
    formula: 'V = l × w × h',
    volume: ({ l, w, h }) => l * w * h,
    surface: ({ l, w, h }) => 2 * (l * w + l * h + w * h),
  },
  cylinder: {
    label: 'Cylinder',
    fields: [
      { key: 'r', label: 'Radius' },
      { key: 'h', label: 'Height' },
    ],
    formula: 'V = πr²h',
    volume: ({ r, h }) => Math.PI * r * r * h,
    surface: ({ r, h }) => 2 * Math.PI * r * (r + h),
  },
  sphere: {
    label: 'Sphere',
    fields: [{ key: 'r', label: 'Radius' }],
    formula: 'V = ⁴⁄₃πr³',
    volume: ({ r }) => (4 / 3) * Math.PI * r ** 3,
    surface: ({ r }) => 4 * Math.PI * r * r,
  },
  hemisphere: {
    label: 'Hemisphere',
    fields: [{ key: 'r', label: 'Radius' }],
    formula: 'V = ⅔πr³',
    volume: ({ r }) => (2 / 3) * Math.PI * r ** 3,
    surface: ({ r }) => 3 * Math.PI * r * r,
  },
  cone: {
    label: 'Cone',
    fields: [
      { key: 'r', label: 'Base radius' },
      { key: 'h', label: 'Height' },
    ],
    formula: 'V = ⅓πr²h',
    volume: ({ r, h }) => (Math.PI * r * r * h) / 3,
    surface: ({ r, h }) => Math.PI * r * (r + Math.hypot(r, h)),
  },
  pyramid: {
    label: 'Square pyramid',
    fields: [
      { key: 's', label: 'Base side' },
      { key: 'h', label: 'Height' },
    ],
    formula: 'V = ⅓ × s² × h',
    volume: ({ s, h }) => (s * s * h) / 3,
    surface: ({ s, h }) => s * s + 2 * s * Math.hypot(s / 2, h),
  },
  capsule: {
    label: 'Capsule',
    fields: [
      { key: 'r', label: 'Radius' },
      { key: 'h', label: 'Cylinder length' },
    ],
    formula: 'V = πr²h + ⁴⁄₃πr³',
    volume: ({ r, h }) => Math.PI * r * r * h + (4 / 3) * Math.PI * r ** 3,
    surface: ({ r, h }) => 2 * Math.PI * r * h + 4 * Math.PI * r * r,
  },
  prism: {
    label: 'Triangular prism',
    fields: [
      { key: 'b', label: 'Triangle base' },
      { key: 't', label: 'Triangle height' },
      { key: 'l', label: 'Prism length' },
    ],
    formula: 'V = ½ × b × h × l',
    volume: ({ b, t, l }) => 0.5 * b * t * l,
    // Assumes an isosceles triangle cross-section.
    surface: ({ b, t, l }) => b * t + l * (b + 2 * Math.hypot(b / 2, t)),
  },
};

// ------------------------------------------------------------------ lines

export interface Line {
  rise: number;
  run: number;
  /** Infinity for a vertical line. */
  slope: number;
  /** Angle of inclination, degrees from the positive x-axis. */
  angle: number;
  distance: number;
  midpoint: [number, number];
  /** y-intercept; NaN for a vertical line. */
  intercept: number;
  /** x-intercept; NaN for a horizontal line not on the axis. */
  xIntercept: number;
  vertical: boolean;
}

export function lineThrough(x1: number, y1: number, x2: number, y2: number): Line | null {
  const rise = y2 - y1;
  const run = x2 - x1;
  if (rise === 0 && run === 0) return null;
  const vertical = run === 0;
  const slope = vertical ? Infinity : rise / run;
  const intercept = vertical ? Number.NaN : y1 - slope * x1;
  return {
    rise,
    run,
    slope,
    angle: vertical ? 90 : Math.atan(slope) / RAD,
    distance: Math.hypot(run, rise),
    midpoint: [(x1 + x2) / 2, (y1 + y2) / 2],
    intercept,
    xIntercept: vertical ? x1 : slope === 0 ? Number.NaN : -intercept / slope,
    vertical,
  };
}
