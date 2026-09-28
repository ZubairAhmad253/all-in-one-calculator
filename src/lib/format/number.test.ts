import { describe, expect, it } from 'vitest';
import { CURRENCY_CODES, currencyDecimals, currencyName, formatMoney } from './number';

describe('currencies', () => {
  it('offers every current ISO currency, including the Gulf currencies', () => {
    expect(CURRENCY_CODES.length).toBeGreaterThan(140);
    for (const c of ['QAR', 'AED', 'SAR', 'KWD', 'BHD', 'OMR', 'USD', 'EUR', 'INR', 'PKR']) expect(CURRENCY_CODES).toContain(c);
    expect(CURRENCY_CODES).toEqual([...CURRENCY_CODES].sort());
  });
  it('leaves out retired currencies and non-ISO codes', () => {
    for (const c of ['HRK', 'SLL', 'ZWL', 'CNH', 'XDR', 'GGP']) expect(CURRENCY_CODES).not.toContain(c);
  });
  it('names and formats Qatari riyals', () => {
    expect(currencyName('QAR')).toBe('Qatari Riyal');
    expect(formatMoney(1234.5, 'QAR', 2)).toBe('QAR 1,234.50'); // Intl uses a non-breaking space
    expect(currencyDecimals('KWD')).toBe(3);
  });
});
