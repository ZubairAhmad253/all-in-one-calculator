/**
 * Time zone conversion with the IANA database built into Intl, so daylight
 * saving rules are always current. Pure functions only.
 */

/** Major zones offered in the picker, west to east. */
export const ZONES = [
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Denver',
  'America/Chicago',
  'America/Mexico_City',
  'America/New_York',
  'America/Toronto',
  'America/Bogota',
  'America/Lima',
  'America/Halifax',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'America/St_Johns',
  'Atlantic/Reykjavik',
  'UTC',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Lisbon',
  'Africa/Lagos',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Europe/Athens',
  'Europe/Istanbul',
  'Africa/Nairobi',
  'Asia/Riyadh',
  'Europe/Moscow',
  'Asia/Tehran',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Kathmandu',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Manila',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Taipei',
  'Australia/Perth',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

/** "America/New_York" → "New York"; "UTC" stays "UTC". */
export const cityName = (zone: string) => zone.split('/').pop()!.replace(/_/g, ' ');

export function isValidZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Offset of `zone` from UTC at instant `t`, in minutes (New York in winter → −300). */
export function zoneOffset(zone: string, t: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(t));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - Math.floor(t / 1000) * 1000) / 60_000);
}

/**
 * The UTC instant for a wall-clock date and time in `zone`. When clocks go
 * back and a time happens twice, the first one is used; in the hour skipped
 * when clocks go forward, the result lands just after the jump.
 */
export function zonedToUtc(date: string, time: string, zone: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  // The two offsets in force around this time (equal except near a change).
  const a = guess - zoneOffset(zone, guess) * 60_000;
  const b = guess - zoneOffset(zone, a) * 60_000;
  const matches = [a, b].filter((t) => utcToZoned(t, zone).time === time).sort((x, y) => x - y);
  return matches.length ? matches[0] : Math.max(a, b);
}

/** Wall-clock date and time of instant `t` in `zone`. */
export function utcToZoned(t: number, zone: string): { date: string; time: string } {
  const offset = zoneOffset(zone, t);
  const d = new Date(t + offset * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

/** "+5:30", "−4", "±0" style label for an offset in minutes. */
export function offsetLabel(minutes: number): string {
  if (minutes === 0) return '±0';
  const sign = minutes > 0 ? '+' : '−';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}
