/**
 * Unit conversion as data. Each quantity (length, weight, ...) lists its
 * units with a way to convert to and from one base unit; every pair of
 * units then converts through that base. Adding a new converter page is
 * mostly adding a new entry to QUANTITIES.
 *
 * Factors are the exact legal definitions where one exists
 * (1 in = 2.54 cm, 1 lb = 0.45359237 kg).
 */

export interface Unit {
  id: string;
  name: string;
  /** Short label, e.g. "km". */
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

/** A unit that is a fixed multiple of the base unit. */
const linear = (id: string, name: string, symbol: string, factor: number): Unit => ({
  id,
  name,
  symbol,
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
});

/** Shown as two parts, e.g. 5 ft 9 in or 11 st 4 lb. */
export interface CompoundUnit {
  id: string;
  name: string;
  major: string;
  minor: string;
  /** Minor units per major unit (12 inches per foot). */
  ratio: number;
}

export interface Quantity {
  id: string;
  /** e.g. "length", used in sentences. */
  noun: string;
  units: Unit[];
  compound?: CompoundUnit;
  defaults: { value: number; from: string; to: string };
  /** Pairs listed as "common conversions". */
  popular: [from: string, to: string][];
  /** False for quantities that can be negative (temperature). */
  positiveOnly: boolean;
  /** Smallest allowed value in base units, e.g. absolute zero. */
  minBase?: number;
}

const IN = 0.0254; // metres, exact
const LB = 0.45359237; // kilograms, exact

export const LENGTH: Quantity = {
  id: 'length',
  noun: 'length',
  units: [
    linear('mm', 'Millimetres', 'mm', 0.001),
    linear('cm', 'Centimetres', 'cm', 0.01),
    linear('m', 'Metres', 'm', 1),
    linear('km', 'Kilometres', 'km', 1000),
    linear('in', 'Inches', 'in', IN),
    linear('ft', 'Feet', 'ft', 12 * IN),
    linear('yd', 'Yards', 'yd', 36 * IN),
    linear('mi', 'Miles', 'mi', 63_360 * IN),
    linear('nmi', 'Nautical miles', 'nmi', 1852),
  ],
  compound: { id: 'ftin', name: 'Feet + inches', major: 'ft', minor: 'in', ratio: 12 },
  defaults: { value: 1, from: 'm', to: 'ft' },
  popular: [
    ['in', 'cm'],
    ['cm', 'in'],
    ['ft', 'm'],
    ['m', 'ft'],
    ['mi', 'km'],
    ['km', 'mi'],
    ['yd', 'm'],
    ['mm', 'in'],
  ],
  positiveOnly: true,
};

export const WEIGHT: Quantity = {
  id: 'weight',
  noun: 'weight',
  units: [
    linear('mg', 'Milligrams', 'mg', 1e-6),
    linear('g', 'Grams', 'g', 0.001),
    linear('kg', 'Kilograms', 'kg', 1),
    linear('t', 'Tonnes (metric)', 't', 1000),
    linear('oz', 'Ounces', 'oz', LB / 16),
    linear('lb', 'Pounds', 'lb', LB),
    linear('st', 'Stone', 'st', 14 * LB),
    linear('ton-us', 'US tons (short)', 'US ton', 2000 * LB),
    linear('ton-uk', 'Imperial tons (long)', 'UK ton', 2240 * LB),
  ],
  compound: { id: 'stlb', name: 'Stone + pounds', major: 'st', minor: 'lb', ratio: 14 },
  defaults: { value: 1, from: 'kg', to: 'lb' },
  popular: [
    ['kg', 'lb'],
    ['lb', 'kg'],
    ['g', 'oz'],
    ['oz', 'g'],
    ['st', 'kg'],
    ['kg', 'st'],
    ['t', 'ton-us'],
    ['mg', 'g'],
  ],
  positiveOnly: true,
};

export const TEMPERATURE: Quantity = {
  id: 'temperature',
  noun: 'temperature',
  // Base unit: kelvin.
  units: [
    { id: 'c', name: 'Celsius', symbol: '°C', toBase: (v) => v + 273.15, fromBase: (k) => k - 273.15 },
    { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9 + 273.15, fromBase: (k) => ((k - 273.15) * 9) / 5 + 32 },
    { id: 'k', name: 'Kelvin', symbol: 'K', toBase: (v) => v, fromBase: (k) => k },
  ],
  defaults: { value: 20, from: 'c', to: 'f' },
  popular: [
    ['c', 'f'],
    ['f', 'c'],
    ['c', 'k'],
    ['k', 'c'],
    ['f', 'k'],
    ['k', 'f'],
  ],
  positiveOnly: false,
  minBase: 0,
};

export const QUANTITIES: Record<string, Quantity> = { length: LENGTH, weight: WEIGHT, temperature: TEMPERATURE };

export function findUnit(q: Quantity, id: string): Unit | undefined {
  return q.units.find((u) => u.id === id);
}

export function convert(q: Quantity, value: number, from: string, to: string): number {
  const f = findUnit(q, from);
  const t = findUnit(q, to);
  if (!f || !t || !Number.isFinite(value)) return Number.NaN;
  if (from === to) return value;
  return t.fromBase(f.toBase(value));
}

/** True if the value is physically impossible (below absolute zero). */
export function belowMinimum(q: Quantity, value: number, unit: string): boolean {
  const u = findUnit(q, unit);
  return q.minBase !== undefined && !!u && u.toBase(value) < q.minBase - 1e-9;
}

/**
 * Split a value in the major unit into whole major units and the minor
 * remainder: 5.75 ft → 5 ft 9 in. The minor part is rounded to `decimals`
 * and carried over if it rounds up to a full major unit (5 ft 12 in → 6 ft 0 in).
 */
export function splitCompound(c: CompoundUnit, majorValue: number, decimals = 1): { major: number; minor: number; sign: 1 | -1 } {
  const sign = majorValue < 0 ? -1 : 1;
  const abs = Math.abs(majorValue);
  let major = Math.floor(abs);
  const p = 10 ** decimals;
  let minor = Math.round((abs - major) * c.ratio * p) / p;
  if (minor >= c.ratio) {
    major += 1;
    minor -= c.ratio;
  }
  return { major, minor, sign };
}

export const joinCompound = (c: CompoundUnit, major: number, minor: number) => major + minor / c.ratio;

/**
 * Display a converted value: 10 significant digits removes floating-point
 * noise (0.30479999… → 0.3048), grouped thousands, E notation at extremes.
 */
export function formatValue(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const clean = Number(v.toPrecision(10));
  if (clean === 0) return '0';
  const abs = Math.abs(clean);
  if (abs >= 1e15 || abs < 1e-7) {
    const [m, e] = clean.toExponential(6).split('e');
    return `${m.replace(/\.?0+$/, '')}E${e.replace('+', '')}`;
  }
  return clean.toLocaleString('en', { maximumFractionDigits: 10 });
}
