import { useEffect, useState } from 'react';
import fallback from '@/data/fallback-rates.json';
import { convert, crossRate, rateDecimals, type RateTable } from '@/lib/calculators/currency';
import { currencyDecimals, currencyName, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { loadLiveRates, RATES_ATTRIBUTION } from '@/lib/rates';
import { NumberField } from '@/components/ui/fields';
import { CurrencyPicker, POPULAR_CURRENCIES } from '@/components/ui/CurrencyPicker';
import { ShareButton } from './shared/results';

const DEFAULTS = { amt: 1_000, from: 'USD', to: 'EUR' };

const PAIRS: [string, string][] = [
  ['USD', 'EUR'],
  ['EUR', 'USD'],
  ['GBP', 'USD'],
  ['USD', 'INR'],
  ['USD', 'PKR'],
  ['USD', 'AED'],
  ['AED', 'INR'],
  ['SAR', 'PKR'],
];

const SNAPSHOT = fallback as RateTable;

export default function CurrencyConverter() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const [table, setTable] = useState<RateTable>(SNAPSHOT);
  const [live, setLive] = useState<'loading' | 'live' | 'offline'>('loading');

  useEffect(() => {
    let cancelled = false;
    loadLiveRates().then((t) => {
      if (cancelled) return;
      if (t) setTable(t);
      setLive(t ? 'live' : 'offline');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const codes = Object.keys(table.rates);
  const from = table.rates[s.from] ? s.from : 'USD';
  const to = table.rates[s.to] ? s.to : 'EUR';
  const rate = crossRate(table.rates, from, to);
  const inverse = crossRate(table.rates, to, from);
  const result = convert(s.amt, table.rates, from, to);

  const money = (v: number, code: string) => formatMoney(v, code, Math.max(currencyDecimals(code), 2));
  const rateText = (r: number) => formatNumber(r, rateDecimals(r));
  const updated = new Date(table.updated * 1000).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
  const others = POPULAR_CURRENCIES.filter((c) => c !== from && table.rates[c]).slice(0, 10);

  const swap = () => {
    set('from', to);
    set('to', from);
  };

  return (
    <div className="space-y-6">
      <section aria-label="Currency converter" className="card p-5 sm:p-7">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto_minmax(0,1.2fr)] md:items-end">
          <NumberField label="Amount" value={s.amt} onChange={(v) => set('amt', v)} locale={localeFor(from)} min={0} decimals={2} />
          <CurrencyPicker label="From" value={from} onChange={(c) => set('from', c)} codes={codes} />
          <button
            type="button"
            onClick={swap}
            aria-label="Swap currencies"
            title="Swap currencies"
            className="grid size-12 place-items-center justify-self-center rounded-full border border-line bg-surface text-muted transition hover:rotate-180 hover:border-brand/40 hover:text-brand md:mb-0"
          >
            {/* Up/down arrows when the fields are stacked (phones), left/right when side by side. */}
            <svg className="size-5 md:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 20V4M8 4 4.5 7.5M8 4l3.5 3.5M16 4v16M16 20l-3.5-3.5M16 20l3.5-3.5" />
            </svg>
            <svg className="hidden size-5 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 7h11l-3-3M17 17H6l3 3" />
            </svg>
          </button>
          <CurrencyPicker label="To" value={to} onChange={(c) => set('to', c)} codes={codes} />
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-6" aria-live="polite">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">
              {money(s.amt, from)} {currencyName(from)} =
            </p>
            <p className="tabular mt-1 text-4xl font-bold tracking-tight break-words sm:text-5xl">{money(result, to)}</p>
            <p className="mt-1 text-sm text-muted">{currencyName(to)}</p>
            <div className="tabular mt-4 space-y-1 text-sm">
              <p>
                1 {from} = <strong>{rateText(rate)}</strong> {to}
              </p>
              <p>
                1 {to} = <strong>{rateText(inverse)}</strong> {from}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
            <ShareButton />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium">Popular conversions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PAIRS.filter(([a, b]) => table.rates[a] && table.rates[b]).map(([a, b]) => {
              const on = a === from && b === to;
              return (
                <button
                  key={a + b}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    set('from', a);
                    set('to', b);
                  }}
                  className={`h-8 rounded-lg border px-3 text-sm font-medium transition ${on ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:border-brand/40 hover:text-fg'}`}
                >
                  {a} → {b}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className={`inline-block size-2 rounded-full ${live === 'live' ? 'bg-accent' : live === 'offline' ? 'bg-warn' : 'bg-line'}`} aria-hidden="true" />
          <span>
            {live === 'offline' ? 'Live rates unavailable, showing saved rates from' : 'Rates updated'} {updated} UTC.
          </span>
          <a href={RATES_ATTRIBUTION.href} rel="noopener" target="_blank" className="font-medium text-brand hover:underline">
            {RATES_ATTRIBUTION.label}
          </a>
        </p>
      </section>

      <section aria-labelledby="fx-table-heading" className="card overflow-hidden">
        <h2 id="fx-table-heading" className="border-b border-line px-5 py-4 text-lg font-semibold sm:px-7">
          {money(s.amt, from)} in popular currencies
        </h2>
        <table className="tabular w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-5 py-2.5 font-medium sm:px-7">Currency</th>
              <th className="px-3 py-2.5 text-right font-medium">Rate</th>
              <th className="px-5 py-2.5 text-right font-medium sm:px-7">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {others.map((c) => {
              const r = crossRate(table.rates, from, c);
              return (
                <tr key={c} className="cursor-pointer hover:bg-surface-2" onClick={() => set('to', c)}>
                  <td className="px-5 py-2.5 sm:px-7">
                    <span className="font-semibold">{c}</span> <span className="hidden text-muted sm:inline">{currencyName(c)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted">{rateText(r)}</td>
                  <td className="px-5 py-2.5 text-right font-medium sm:px-7">{money(s.amt * r, c)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
