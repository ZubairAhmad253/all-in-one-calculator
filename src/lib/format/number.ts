/** Currencies offered in money calculators. Symbols come from Intl. */
export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'AED', label: 'UAE Dirham' },
  { code: 'SAR', label: 'Saudi Riyal' },
  { code: 'PKR', label: 'Pakistani Rupee' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'CNY', label: 'Chinese Yuan' },
  { code: 'ZAR', label: 'South African Rand' },
  { code: 'NGN', label: 'Nigerian Naira' },
  { code: 'BRL', label: 'Brazilian Real' },
  { code: 'MXN', label: 'Mexican Peso' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

const cache = new Map<string, Intl.NumberFormat>();
const fmt = (key: string, make: () => Intl.NumberFormat) => {
  let f = cache.get(key);
  if (!f) cache.set(key, (f = make()));
  return f;
};

/** Rupee amounts read naturally in lakh/crore grouping (12,34,567). */
export const localeFor = (currency: string) => (currency === 'INR' ? 'en-IN' : 'en');

export function formatMoney(value: number, currency: string, decimals = 0): string {
  return fmt(`m:${currency}:${decimals}`, () =>
    new Intl.NumberFormat(localeFor(currency), {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  ).format(Number.isFinite(value) ? value : 0);
}

/** Compact money for chart axes, e.g. $1.2M. */
export function formatMoneyCompact(value: number, currency: string): string {
  return fmt(`c:${currency}`, () =>
    new Intl.NumberFormat(localeFor(currency), { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }),
  ).format(value);
}

export function currencySymbol(currency: string): string {
  return (
    fmt(`s:${currency}`, () => new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }))
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? currency
  );
}

export function formatNumber(value: number, maxDecimals = 2, locale = 'en'): string {
  return fmt(`n:${locale}:${maxDecimals}`, () => new Intl.NumberFormat(locale, { maximumFractionDigits: maxDecimals })).format(value);
}

/** Parse user input like "1,250.50" or "  300000 " into a number. */
export function parseNumber(text: string): number {
  const n = Number(text.replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

export function formatDuration(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} yr${y === 1 ? '' : 's'}`);
  if (m) parts.push(`${m} mo`);
  return parts.join(' ') || '0 mo';
}
