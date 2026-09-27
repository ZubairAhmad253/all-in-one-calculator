/**
 * Home improvement and building quantities: paint, tiles, flooring,
 * concrete, bricks, roofing and wallpaper. Everything is metric inside
 * (metres, square metres, cubic metres, litres); pages convert units.
 * Pure functions only.
 */

export const M_PER_FT = 0.3048;
export const M2_PER_FT2 = M_PER_FT ** 2;
export const M3_PER_YD3 = (3 * M_PER_FT) ** 3;
export const L_PER_US_GAL = 3.785411784;

const pos = (...xs: number[]) => xs.every((x) => Number.isFinite(x) && x > 0);
const addWaste = (v: number, wastePct: number) => v * (1 + Math.max(0, wastePct) / 100);

// ----------------------------------------------------------------- paint

export interface PaintInput {
  length: number;
  width: number;
  height: number;
  doors: number;
  windows: number;
  coats: number;
  includeCeiling: boolean;
  /** Square metres one litre covers per coat (typically 10–12). */
  coverage: number;
}

/** Standard openings deducted from the wall area. */
export const DOOR_M2 = 1.9; // about 0.9 × 2.1 m
export const WINDOW_M2 = 1.5; // about 1.2 × 1.2 m

export function paint(p: PaintInput) {
  if (!pos(p.length, p.width, p.height, p.coverage)) return null;
  const walls = 2 * (p.length + p.width) * p.height;
  const openings = Math.max(0, p.doors) * DOOR_M2 + Math.max(0, p.windows) * WINDOW_M2;
  const wallArea = Math.max(0, walls - openings);
  const ceiling = p.includeCeiling ? p.length * p.width : 0;
  const area = wallArea + ceiling;
  const coats = Math.max(1, Math.round(p.coats));
  const litres = (area * coats) / p.coverage;
  return { walls, openings, wallArea, ceiling, area, coats, litres };
}

/**
 * Tins to buy for `litres`: the least paint bought, where each extra tin
 * counts as 0.6 of the smallest size (so 5 + 2.5 beats 5 + 1 + 1). Sizes
 * are few, so every mix is tried.
 */
export function tins(litres: number, sizes: number[]): { size: number; count: number }[] {
  if (!(litres > 0) || !sizes.length) return [];
  const sorted = [...sizes].sort((a, b) => b - a);
  const penalty = 0.6 * sorted[sorted.length - 1];
  let best: { counts: number[]; total: number; tins: number } | null = null;
  const search = (i: number, counts: number[], total: number) => {
    if (i === sorted.length - 1) {
      const need = Math.max(0, Math.ceil((litres - total) / sorted[i] - 1e-9));
      const c = [...counts, need];
      const t = total + need * sorted[i];
      const n = c.reduce((a, x) => a + x, 0);
      if (!best || t + n * penalty < best.total + best.tins * penalty - 1e-9) best = { counts: c, total: t, tins: n };
      return;
    }
    const max = Math.ceil((litres - total) / sorted[i] - 1e-9);
    for (let k = 0; k <= Math.max(0, max); k++) search(i + 1, [...counts, k], total + k * sorted[i]);
  };
  search(0, [], 0);
  return best!.counts.map((count, i) => ({ size: sorted[i], count })).filter((t) => t.count > 0);
}

// ----------------------------------------------------------------- tiles

export interface TileInput {
  /** Area to tile, m². */
  area: number;
  /** Tile size in metres. */
  tileLength: number;
  tileWidth: number;
  /** Grout joint in metres. */
  grout: number;
  wastePct: number;
  perBox: number;
}

export function tiles(t: TileInput) {
  if (!pos(t.area, t.tileLength, t.tileWidth)) return null;
  const tileArea = (t.tileLength + Math.max(0, t.grout)) * (t.tileWidth + Math.max(0, t.grout));
  const exact = t.area / tileArea;
  const count = Math.ceil(addWaste(exact, t.wastePct) - 1e-9);
  const boxes = t.perBox > 0 ? Math.ceil(count / t.perBox) : Number.NaN;
  return { tileArea, exact, count, boxes };
}

// -------------------------------------------------------------- flooring

export function flooring(area: number, wastePct: number, boxCoverage: number, pricePerM2: number) {
  if (!pos(area)) return null;
  const buy = addWaste(area, wastePct);
  const boxes = boxCoverage > 0 ? Math.ceil(buy / boxCoverage - 1e-9) : Number.NaN;
  const bought = Number.isFinite(boxes) ? boxes * boxCoverage : buy;
  return { area, buy, boxes, bought, cost: bought * Math.max(0, pricePerM2) };
}

// -------------------------------------------------------------- concrete

export type ConcreteShape = 'slab' | 'column' | 'tube';

/**
 * Volume in m³. slab: length × width × depth; column: diameter × height;
 * tube (sonotube with a hollow core): outer and inner diameter × height.
 */
export function concreteVolume(shape: ConcreteShape, a: number, b: number, c: number): number {
  if (shape === 'slab') return pos(a, b, c) ? a * b * c : Number.NaN;
  if (shape === 'column') return pos(a, b) ? Math.PI * (a / 2) ** 2 * b : Number.NaN;
  return pos(a, c) && b >= 0 && b < a ? Math.PI * ((a / 2) ** 2 - (b / 2) ** 2) * c : Number.NaN;
}

/** Yield of premixed bags, in m³. */
export const CONCRETE_BAGS = [
  { id: '80lb', label: '80 lb bag', yield: 0.6 * M2_PER_FT2 * M_PER_FT },
  { id: '60lb', label: '60 lb bag', yield: 0.45 * M2_PER_FT2 * M_PER_FT },
  { id: '40lb', label: '40 lb bag', yield: 0.3 * M2_PER_FT2 * M_PER_FT },
  { id: '25kg', label: '25 kg bag', yield: 0.012 },
  { id: '20kg', label: '20 kg bag', yield: 0.0096 },
] as const;

// ----------------------------------------------------------------- bricks

export const BRICKS = [
  { id: 'uk', label: 'UK / metric standard (215 × 102.5 × 65 mm)', length: 0.215, height: 0.065, depth: 0.1025 },
  { id: 'us-modular', label: 'US modular (7⅝ × 3⅝ × 2¼ in)', length: 0.1937, height: 0.0572, depth: 0.0921 },
  { id: 'us-standard', label: 'US standard (8 × 3⅝ × 2¼ in)', length: 0.2032, height: 0.0572, depth: 0.0921 },
  { id: 'queen', label: 'Queen (7⅝ × 2¾ × 2¾ in)', length: 0.1937, height: 0.0699, depth: 0.0699 },
] as const;
export type BrickId = (typeof BRICKS)[number]['id'];

/** Bricks for a single-skin wall of `area` m² with `joint` m mortar joints. */
export function bricks(area: number, brick: BrickId, joint: number, wastePct: number) {
  const b = BRICKS.find((x) => x.id === brick) ?? BRICKS[0];
  if (!pos(area)) return null;
  const perM2 = 1 / ((b.length + joint) * (b.height + joint));
  const exact = area * perM2;
  const count = Math.ceil(addWaste(exact, wastePct) - 1e-9);
  // Mortar ≈ wall volume minus the bricks themselves, plus 20% for frogs and wastage.
  const mortar = Math.max(0, area * b.depth - exact * b.length * b.height * b.depth) * 1.2;
  return { perM2, exact, count, mortar };
}

// ---------------------------------------------------------------- roofing

/** Slope multiplier for a pitch of `rise` in 12: √(1 + (rise ÷ 12)²). */
export const pitchFactor = (rise: number) => Math.sqrt(1 + (Math.max(0, rise) / 12) ** 2);
export const pitchDegrees = (rise: number) => (Math.atan(Math.max(0, rise) / 12) * 180) / Math.PI;

/** Roof area in m² from the building footprint (plus overhang all round) and pitch. */
export function roof(length: number, width: number, overhang: number, rise: number, wastePct: number) {
  if (!pos(length, width)) return null;
  const o = Math.max(0, overhang);
  const footprint = (length + 2 * o) * (width + 2 * o);
  const area = footprint * pitchFactor(rise);
  const withWaste = addWaste(area, wastePct);
  // 1 roofing square = 100 ft²; 3 bundles of standard shingles per square.
  const squares = withWaste / (100 * M2_PER_FT2);
  return { footprint, area, withWaste, squares, bundles: Math.ceil(squares * 3 - 1e-9) };
}

// --------------------------------------------------------------- wallpaper

export interface WallpaperInput {
  /** Total width of the walls to paper, m (the room perimeter). */
  perimeter: number;
  height: number;
  rollLength: number;
  rollWidth: number;
  /** Pattern repeat, m (0 for plain). */
  repeat: number;
  /** Width of doors and windows to skip, m. */
  openingsWidth: number;
  wastePct: number;
}

export function wallpaper(w: WallpaperInput) {
  if (!pos(w.perimeter, w.height, w.rollLength, w.rollWidth)) return null;
  // Each drop is the wall height rounded up to a whole pattern repeat.
  const drop = w.repeat > 0 ? Math.ceil(w.height / w.repeat - 1e-9) * w.repeat : w.height;
  const dropsPerRoll = Math.floor(w.rollLength / drop + 1e-9);
  if (dropsPerRoll < 1) return { drop, dropsPerRoll, drops: 0, rolls: Number.NaN };
  const width = Math.max(0, w.perimeter - Math.max(0, w.openingsWidth));
  const drops = Math.ceil(width / w.rollWidth - 1e-9);
  const rolls = Math.ceil(addWaste(drops / dropsPerRoll, w.wastePct) - 1e-9);
  return { drop, dropsPerRoll, drops, rolls };
}
