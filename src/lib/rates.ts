/**
 * Live exchange rates for the browser.
 *
 * Source: ExchangeRate-API's open endpoint (free, no key, daily updates).
 * Its terms require a visible "Rates By Exchange Rate API" link wherever
 * the rates are shown: see RATES_ATTRIBUTION.
 *
 * Rates are cached in localStorage for an hour, so repeat visits don't hit
 * the API. If anything fails, callers keep using the build-time snapshot
 * in src/data/fallback-rates.json.
 */
import { isRateTable, type RateTable } from './calculators/currency';

const API_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_KEY = 'fx-rates-v1';
const CACHE_MS = 60 * 60 * 1000;

export const RATES_ATTRIBUTION = { label: 'Rates By Exchange Rate API', href: 'https://www.exchangerate-api.com' };

interface Cached {
  savedAt: number;
  table: RateTable;
}

function readCache(): RateTable | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    return Date.now() - c.savedAt < CACHE_MS && isRateTable(c.table) ? c.table : null;
  } catch {
    return null;
  }
}

function writeCache(table: RateTable) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), table } satisfies Cached));
  } catch {
    /* Storage full or blocked (private mode): just skip caching. */
  }
}

/** Latest rates, or null if they can't be fetched. */
export async function loadLiveRates(): Promise<RateTable | null> {
  const cached = readCache();
  if (cached) return cached;
  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.result !== 'success') return null;
    const table = { base: data.base_code, updated: data.time_last_update_unix, rates: data.rates };
    if (!isRateTable(table)) return null;
    writeCache(table);
    return table;
  } catch {
    return null;
  }
}
