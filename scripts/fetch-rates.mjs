/**
 * Saves a snapshot of exchange rates to src/data/fallback-rates.json.
 * Runs automatically before `npm run build` (the "prebuild" script).
 *
 * The currency converter fetches live rates in the browser; this snapshot
 * is what it shows first and falls back to if the API can't be reached.
 * If the fetch fails here, the existing snapshot is kept and the build
 * continues.
 */
import { readFile, writeFile } from 'node:fs/promises';

const URL = 'https://open.er-api.com/v6/latest/USD';
const OUT = new globalThis.URL('../src/data/fallback-rates.json', import.meta.url);

try {
  const res = await fetch(URL, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.result !== 'success' || !data.rates || Object.keys(data.rates).length < 100) throw new Error('unexpected response');

  const snapshot = { base: data.base_code, updated: data.time_last_update_unix, rates: data.rates };
  await writeFile(OUT, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`[rates] saved ${Object.keys(snapshot.rates).length} rates from ${data.time_last_update_utc}`);
} catch (err) {
  const existing = JSON.parse(await readFile(OUT, 'utf8').catch(() => 'null'));
  if (!existing) throw new Error(`[rates] could not fetch rates and no snapshot exists: ${err.message}`);
  console.warn(`[rates] fetch failed (${err.message}); keeping snapshot from ${new Date(existing.updated * 1000).toUTCString()}`);
}
