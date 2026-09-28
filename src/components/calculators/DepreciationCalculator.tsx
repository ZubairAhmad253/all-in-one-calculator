import { depreciation, type DepreciationMethod } from '@/lib/calculators/business';
import { CURRENCY_CODES, localeFor, currencySymbol, formatMoney, formatMoneyCompact } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { LineChart } from '@/components/charts/LineChart';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { cost: 10_000, salvage: 1_000, life: 5, method: 'straight', cur: 'USD' };

const METHODS: { value: DepreciationMethod; label: string }[] = [
  { value: 'straight', label: 'Straight-line' },
  { value: 'double', label: 'Double declining balance (200%)' },
  { value: 'declining', label: 'Declining balance (150%)' },
];

export default function DepreciationCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const method = (METHODS.some((m) => m.value === s.method) ? s.method : 'straight') as DepreciationMethod;
  const life = Math.min(Math.max(Math.round(s.life), 1), 50);
  const rows = depreciation(s.cost, s.salvage, life, method);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);
  const total = rows.at(-1)?.accumulated ?? 0;

  return (
    <section aria-label="Depreciation calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Asset cost" value={s.cost} onChange={(v) => set('cost', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          <NumberField label="Salvage value" value={s.salvage} onChange={(v) => set('salvage', v)} prefix={sym} locale={loc} min={0} decimals={0} hint="What it will be worth at the end of its useful life." />
          <NumberField label="Useful life" value={s.life} onChange={(v) => set('life', v)} suffix="years" min={1} max={50} decimals={0} />
          <SelectField label="Method" value={method} onChange={(v) => set('method', v)} options={METHODS} />
          <div className="flex flex-wrap items-end gap-3 border-t border-line pt-5">
            <div className="min-w-40 flex-1">
              <CurrencyPicker label="Currency" value={cur} onChange={(v) => set('cur', v)} codes={CURRENCY_CODES} />
            </div>
            <button type="button" onClick={reset} className="h-12 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>

        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <Headline label="First-year depreciation" value={money(rows[0]?.depreciation ?? 0)} action={<ShareButton />} />
          <div className="mt-6">
            <StatGrid
              items={[
                ['Total depreciation', money(total)],
                ['Book value at the end', money(rows.at(-1)?.end ?? s.cost)],
                ['Rate (declining methods)', method === 'straight' ? '—' : `${((method === 'double' ? 2 : 1.5) / life * 100).toFixed(2)}% of book value`],
                ['Years', String(life)],
              ]}
            />
          </div>
          <div className="mt-6 max-h-80 overflow-auto rounded-xl border border-line bg-surface">
            <table className="tabular w-full text-sm">
              <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Year</th>
                  <th className="px-3 py-2 text-right font-medium">Depreciation</th>
                  <th className="px-3 py-2 text-right font-medium">Accumulated</th>
                  <th className="px-3 py-2 text-right font-medium">Book value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.year}>
                    <td className="px-3 py-2">{r.year}</td>
                    <td className="px-3 py-2 text-right">{money(r.depreciation)}</td>
                    <td className="px-3 py-2 text-right">{money(r.accumulated)}</td>
                    <td className="px-3 py-2 text-right font-medium">{money(r.end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="border-t border-line p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Book value by method</h2>
        <div className="mt-5">
          <LineChart
            labels={[0, ...rows.map((r) => r.year)]}
            xTitle="Year"
            formatY={(v) => formatMoneyCompact(v, cur)}
            formatTooltip={money}
            series={METHODS.map((m, i) => ({
              label: m.label,
              color: ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)'][i],
              values: [s.cost, ...depreciation(s.cost, s.salvage, life, m.value).map((r) => r.end)],
            }))}
          />
        </div>
        <p className="mt-3 text-xs text-muted">Declining-balance methods switch to straight-line when that gives more, and never go below the salvage value. Tax rules on depreciation vary by country.</p>
      </div>
    </section>
  );
}
