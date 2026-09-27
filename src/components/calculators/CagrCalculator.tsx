import { cagr, projectValue } from '@/lib/calculators/pay';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { mode: 'rate', start: 10_000, end: 20_000, rate: 12, years: 5, cur: 'USD' };

export default function CagrCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'project' ? 'project' : 'rate';
  const rate = mode === 'rate' ? cagr(s.start, s.end, s.years) : s.rate;
  const end = mode === 'rate' ? s.end : projectValue(s.start, s.rate, s.years);
  const valid = Number.isFinite(rate) && Number.isFinite(end);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur, 2);
  const years = Math.max(0, Math.floor(s.years));
  const rows = valid ? Array.from({ length: Math.min(years, 40) + 1 }, (_, y) => ({ y, v: projectValue(s.start, rate, y) })) : [];

  return (
    <section aria-label="CAGR calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">I want to</p>
            <Tabs
              value={mode}
              onChange={(v) => set('mode', v)}
              tabs={[
                { value: 'rate', label: 'Find the CAGR' },
                { value: 'project', label: 'Project a value' },
              ]}
            />
          </div>
          <NumberField label="Starting value" value={s.start} onChange={(v) => set('start', v)} prefix={sym} locale={loc} min={0} decimals={2} />
          {mode === 'rate' ? (
            <NumberField label="Ending value" value={s.end} onChange={(v) => set('end', v)} prefix={sym} locale={loc} min={0} decimals={2} />
          ) : (
            <NumberField label="Growth rate (CAGR)" value={s.rate} onChange={(v) => set('rate', v)} suffix="% / yr" min={-99} max={1000} decimals={2} />
          )}
          <NumberField label="Period" value={s.years} onChange={(v) => set('years', v)} suffix="years" min={0} max={100} decimals={2} />
          <div className="flex flex-wrap items-end gap-3 border-t border-line pt-5">
            <div className="min-w-40 flex-1">
              <SelectField label="Currency" value={cur} onChange={(v) => set('cur', v)} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} – ${c.label}` }))} />
            </div>
            <button type="button" onClick={reset} className="h-12 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>

        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="font-medium text-warn">Enter a starting value above 0 and a period longer than 0 years.</p>
          ) : (
            <>
              <Headline label={mode === 'rate' ? 'Compound annual growth rate' : `Value after ${formatNumber(s.years, 2)} years`} value={mode === 'rate' ? `${formatNumber(rate, 2)}%` : money(end)} action={<ShareButton />} />
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Total growth', `${formatNumber((end / s.start - 1) * 100, 2)}%`],
                    ['Growth multiple', `${formatNumber(end / s.start, 3)}×`],
                    ['Gain', money(end - s.start)],
                    ['Simple average per year', `${formatNumber(((end / s.start - 1) * 100) / s.years, 2)}%`],
                  ]}
                />
              </div>
              <p className="tabular mt-4 text-sm text-muted">
                CAGR = ({money(end)} ÷ {money(s.start)})<sup>1 ÷ {formatNumber(s.years, 2)}</sup> − 1 = {formatNumber(rate, 2)}%
              </p>
              {rows.length > 1 && (
                <div className="mt-6 max-h-72 overflow-auto rounded-xl border border-line bg-surface">
                  <table className="tabular w-full text-sm">
                    <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
                      <tr>
                        <th className="px-4 py-2 font-medium">Year</th>
                        <th className="px-4 py-2 text-right font-medium">Value at {formatNumber(rate, 2)}% a year</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {rows.map((row) => (
                        <tr key={row.y}>
                          <td className="px-4 py-2">{row.y}</td>
                          <td className="px-4 py-2 text-right">{money(row.v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
