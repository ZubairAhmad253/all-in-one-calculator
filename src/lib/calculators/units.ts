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

const FT = 12 * IN;
const MI = 63_360 * IN;
const US_GAL = 3.785411784; // litres, exact
const UK_GAL = 4.54609; // litres, exact

export const AREA: Quantity = {
  id: 'area',
  noun: 'area',
  // Base unit: square metre.
  units: [
    linear('mm2', 'Square millimetres', 'mm²', 1e-6),
    linear('cm2', 'Square centimetres', 'cm²', 1e-4),
    linear('m2', 'Square metres', 'm²', 1),
    linear('ha', 'Hectares', 'ha', 10_000),
    linear('km2', 'Square kilometres', 'km²', 1e6),
    linear('in2', 'Square inches', 'in²', IN * IN),
    linear('ft2', 'Square feet', 'ft²', FT * FT),
    linear('yd2', 'Square yards', 'yd²', 9 * FT * FT),
    linear('ac', 'Acres', 'ac', 43_560 * FT * FT),
    linear('mi2', 'Square miles', 'mi²', MI * MI),
  ],
  defaults: { value: 1, from: 'm2', to: 'ft2' },
  popular: [
    ['m2', 'ft2'],
    ['ft2', 'm2'],
    ['ac', 'ha'],
    ['ha', 'ac'],
    ['ac', 'ft2'],
    ['km2', 'mi2'],
    ['cm2', 'in2'],
    ['yd2', 'm2'],
  ],
  positiveOnly: true,
};

export const VOLUME: Quantity = {
  id: 'volume',
  noun: 'volume',
  // Base unit: litre.
  units: [
    linear('ml', 'Millilitres', 'ml', 0.001),
    linear('l', 'Litres', 'L', 1),
    linear('m3', 'Cubic metres', 'm³', 1000),
    linear('tsp', 'Teaspoons (US)', 'tsp', US_GAL / 768),
    linear('tbsp', 'Tablespoons (US)', 'tbsp', US_GAL / 256),
    linear('floz', 'Fluid ounces (US)', 'fl oz', US_GAL / 128),
    linear('cup', 'Cups (US)', 'cup', US_GAL / 16),
    linear('pt', 'Pints (US)', 'pt', US_GAL / 8),
    linear('qt', 'Quarts (US)', 'qt', US_GAL / 4),
    linear('gal', 'Gallons (US)', 'gal', US_GAL),
    linear('floz-uk', 'Fluid ounces (UK)', 'UK fl oz', UK_GAL / 160),
    linear('pt-uk', 'Pints (UK)', 'UK pt', UK_GAL / 8),
    linear('gal-uk', 'Gallons (UK)', 'UK gal', UK_GAL),
    linear('in3', 'Cubic inches', 'in³', (IN * 10) ** 3),
    linear('ft3', 'Cubic feet', 'ft³', (FT * 10) ** 3),
  ],
  defaults: { value: 1, from: 'l', to: 'gal' },
  popular: [
    ['l', 'gal'],
    ['gal', 'l'],
    ['ml', 'floz'],
    ['floz', 'ml'],
    ['cup', 'ml'],
    ['l', 'pt-uk'],
    ['gal-uk', 'l'],
    ['m3', 'ft3'],
  ],
  positiveOnly: true,
};

export const SPEED: Quantity = {
  id: 'speed',
  noun: 'speed',
  // Base unit: metres per second.
  units: [
    linear('mps', 'Metres per second', 'm/s', 1),
    linear('kph', 'Kilometres per hour', 'km/h', 1 / 3.6),
    linear('mph', 'Miles per hour', 'mph', MI / 3600),
    linear('kn', 'Knots', 'kn', 1852 / 3600),
    linear('fps', 'Feet per second', 'ft/s', FT),
    linear('mach', 'Mach (sea level, 15 °C)', 'Mach', 340.294),
  ],
  defaults: { value: 100, from: 'kph', to: 'mph' },
  popular: [
    ['kph', 'mph'],
    ['mph', 'kph'],
    ['mps', 'kph'],
    ['kn', 'kph'],
    ['kn', 'mph'],
    ['fps', 'mph'],
  ],
  positiveOnly: true,
};

const DAY = 86_400;

export const TIME: Quantity = {
  id: 'time',
  noun: 'time',
  // Base unit: second. Months and years are Gregorian-calendar averages.
  units: [
    linear('us', 'Microseconds', 'µs', 1e-6),
    linear('ms', 'Milliseconds', 'ms', 0.001),
    linear('s', 'Seconds', 's', 1),
    linear('min', 'Minutes', 'min', 60),
    linear('h', 'Hours', 'h', 3600),
    linear('d', 'Days', 'd', DAY),
    linear('wk', 'Weeks', 'wk', 7 * DAY),
    linear('mo', 'Months (average)', 'mo', (365.2425 / 12) * DAY),
    linear('yr', 'Years (average)', 'yr', 365.2425 * DAY),
    linear('dec', 'Decades', 'decades', 3652.425 * DAY),
    linear('cen', 'Centuries', 'centuries', 36_524.25 * DAY),
  ],
  defaults: { value: 1, from: 'd', to: 'h' },
  popular: [
    ['h', 'min'],
    ['min', 's'],
    ['d', 'h'],
    ['wk', 'd'],
    ['yr', 'd'],
    ['h', 's'],
    ['mo', 'd'],
    ['s', 'ms'],
  ],
  positiveOnly: true,
};

export const DATA: Quantity = {
  id: 'data',
  noun: 'data size',
  // Base unit: byte. Decimal (SI) and binary (IEC) prefixes.
  units: [
    linear('bit', 'Bits', 'bit', 1 / 8),
    linear('b', 'Bytes', 'B', 1),
    linear('kb', 'Kilobytes', 'KB', 1e3),
    linear('mb', 'Megabytes', 'MB', 1e6),
    linear('gb', 'Gigabytes', 'GB', 1e9),
    linear('tb', 'Terabytes', 'TB', 1e12),
    linear('pb', 'Petabytes', 'PB', 1e15),
    linear('kib', 'Kibibytes', 'KiB', 1024),
    linear('mib', 'Mebibytes', 'MiB', 1024 ** 2),
    linear('gib', 'Gibibytes', 'GiB', 1024 ** 3),
    linear('tib', 'Tebibytes', 'TiB', 1024 ** 4),
    linear('mbit', 'Megabits', 'Mb', 1e6 / 8),
    linear('gbit', 'Gigabits', 'Gb', 1e9 / 8),
  ],
  defaults: { value: 1, from: 'gb', to: 'mb' },
  popular: [
    ['gb', 'mb'],
    ['tb', 'gb'],
    ['mb', 'kb'],
    ['gb', 'gib'],
    ['tb', 'tib'],
    ['mbit', 'mb'],
    ['b', 'bit'],
    ['mib', 'mb'],
  ],
  positiveOnly: true,
};

export const PRESSURE: Quantity = {
  id: 'pressure',
  noun: 'pressure',
  // Base unit: pascal.
  units: [
    linear('pa', 'Pascals', 'Pa', 1),
    linear('hpa', 'Hectopascals', 'hPa', 100),
    linear('kpa', 'Kilopascals', 'kPa', 1000),
    linear('mpa', 'Megapascals', 'MPa', 1e6),
    linear('mbar', 'Millibar', 'mbar', 100),
    linear('bar', 'Bar', 'bar', 1e5),
    linear('psi', 'Pounds per square inch', 'psi', (LB * 9.80665) / (IN * IN)),
    linear('atm', 'Standard atmospheres', 'atm', 101_325),
    linear('mmhg', 'Millimetres of mercury', 'mmHg', 133.322387415),
    linear('inhg', 'Inches of mercury', 'inHg', 3386.389),
    linear('torr', 'Torr', 'Torr', 101_325 / 760),
  ],
  defaults: { value: 1, from: 'bar', to: 'psi' },
  popular: [
    ['bar', 'psi'],
    ['psi', 'bar'],
    ['psi', 'kpa'],
    ['kpa', 'psi'],
    ['atm', 'pa'],
    ['mmhg', 'kpa'],
    ['hpa', 'inhg'],
    ['mbar', 'hpa'],
  ],
  positiveOnly: true,
};

export const QUANTITIES: Record<string, Quantity> = {
  length: LENGTH,
  weight: WEIGHT,
  temperature: TEMPERATURE,
  area: AREA,
  volume: VOLUME,
  speed: SPEED,
  time: TIME,
  data: DATA,
  pressure: PRESSURE,
};

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
