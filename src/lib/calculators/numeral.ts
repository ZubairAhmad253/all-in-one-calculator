/**
 * Number systems: whole numbers in any base from 2 to 36 (exact, via
 * BigInt) and Roman numerals. Pure functions only.
 */

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Parse a whole number written in `base`. Accepts an optional sign, spaces
 * or underscores between digits, and 0b / 0o / 0x prefixes that match the
 * base. Returns null if any digit is invalid.
 */
export function parseInBase(text: string, base: number): bigint | null {
  let t = text.trim().toLowerCase().replace(/[\s_]/g, '');
  let sign = 1n;
  if (t.startsWith('-')) {
    sign = -1n;
    t = t.slice(1);
  } else if (t.startsWith('+')) t = t.slice(1);
  const prefix = { 2: '0b', 8: '0o', 16: '0x' }[base as 2 | 8 | 16];
  if (prefix && t.startsWith(prefix)) t = t.slice(2);
  if (!t) return null;
  let v = 0n;
  const b = BigInt(base);
  for (const ch of t) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= base) return null;
    v = v * b + BigInt(d);
  }
  return sign * v;
}

/** Write a BigInt in `base` (2–36), lower-case digits. */
export function toBase(value: bigint, base: number): string {
  if (value === 0n) return '0';
  const neg = value < 0n;
  let v = neg ? -value : value;
  const b = BigInt(base);
  let out = '';
  while (v > 0n) {
    out = DIGITS[Number(v % b)] + out;
    v /= b;
  }
  return (neg ? '-' : '') + out;
}

/** Split digits into groups from the right: 11111111 → "1111 1111". */
export function groupDigits(s: string, size: number, sep = ' '): string {
  const neg = s.startsWith('-');
  const d = neg ? s.slice(1) : s;
  const parts: string[] = [];
  for (let i = d.length; i > 0; i -= size) parts.unshift(d.slice(Math.max(0, i - size), i));
  return (neg ? '-' : '') + parts.join(sep);
}

// ---------------------------------------------------------------- Roman

const ROMAN: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export const ROMAN_MAX = 3999;

/** 1–3999 → standard Roman numeral, with the parts used (e.g. MCM → [M, CM]). */
export function toRoman(n: number): { numeral: string; parts: { value: number; symbol: string }[] } | null {
  if (!Number.isInteger(n) || n < 1 || n > ROMAN_MAX) return null;
  let rest = n;
  const parts: { value: number; symbol: string }[] = [];
  for (const [value, symbol] of ROMAN)
    while (rest >= value) {
      parts.push({ value, symbol });
      rest -= value;
    }
  return { numeral: parts.map((p) => p.symbol).join(''), parts };
}

/**
 * Roman numeral → number. Only standard (canonical) numerals are accepted,
 * so "IIII" or "IC" return null, with a reason.
 */
export function fromRoman(text: string): { value: number } | { error: string } {
  const t = text.trim().toUpperCase();
  if (!t) return { error: 'Enter a Roman numeral.' };
  if (/[^MDCLXVI]/.test(t)) return { error: 'Use only the letters I, V, X, L, C, D and M.' };
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < t.length; i++) {
    const v = map[t[i]];
    const next = map[t[i + 1]] ?? 0;
    total += v < next ? -v : v;
  }
  const canonical = toRoman(total)?.numeral;
  if (canonical !== t) return { error: canonical ? `That isn’t standard form. ${total} is written ${canonical}.` : 'That isn’t a valid Roman numeral.' };
  return { value: total };
}
