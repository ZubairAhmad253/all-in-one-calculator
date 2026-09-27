import { futureCost, todaysValue } from '@/lib/calculators/savings';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, QuickPicks, SelectField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { mode: 'cost', amt: 1_000, inf: 3, years: 10, cur: 'USD' };

export default function InflationCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'power' ? 'power' : 'cost';
  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur, 2);

  const result = mode === 'cost' ? futureCost(s.amt, s.inf, s.years) : todaysValue(s.amt, s.inf, s.years);
  const change = mode === 'cost' ? (result / s.amt - 1) * 100 : (1 - result / s.amt) * 100;
  const halving = s.inf > 0 ? Math.log(2) / Math.log(1 + s.inf / 100) : Infinity;
  const table = [1, 5, 10, 20, 30].map((y) => ({ y, v: mode === 'cost' ? futureCost(s.amt, s.inf, y) : todaysValue(s.amt, s.inf, y) }));

  return (
    <section aria-label="Inflation calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">I want to see</p>
            <Tabs
              value={mode}
              onChange={(v) => set('mode', v)}
              tabs={[
                { value: 'cost', label: 'Future cost' },
                { value: 'power', label: 'Buying power' },
              ]}
            />
          </div>
          <NumberField
            label={mode === 'cost' ? 'Price today' : 'Amount of money'}
            value={s.amt}
            onChange={(v) => set('amt', v)}
            prefix={sym}
            locale={loc}
            min={0}
            decimals={2}
            hint={mode === 'cost' ? 'What will something that costs this today cost later?' : 'What will this amount be able to buy later, in today’s money?'}
          />
          <div>
            <NumberField label="Inflation rate" value={s.inf} onChange={(v) => set('inf', v)} suffix="% per year" min={0} max={100} decimals={2} />
            <QuickPicks label="Common inflation rates" values={[2, 3, 5, 7, 10]} value={s.inf} onPick={(v) => set('inf', v)} />
          </div>
          <NumberField label="Years" value={s.years} onChange={(v) => set('years', v)} suffix="years" min={0} max={100} decimals={1} slider={{ min: 1, max: 50, step: 1 }} />
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
          <Headline label={mode === 'cost' ? `Cost in ${formatNumber(s.years, 1)} years` : `Worth in today’s money`} value={money(result)} action={<ShareButton />} />
          <p className="mt-1 text-sm text-muted">
            {mode === 'cost'
              ? `Prices rise ${formatNumber(change, 1)}% in total at ${formatNumber(s.inf, 2)}% a year.`
              : `${money(s.amt)} loses ${formatNumber(change, 1)}% of its buying power over ${formatNumber(s.years, 1)} years.`}
          </p>
          <div className="mt-6">
            <StatGrid
              items={[
                ['Total change', `${formatNumber(change, 1)}%`],
                ['Prices double every', Number.isFinite(halving) ? `${formatNumber(halving, 1)} years` : 'Never'],
              ]}
            />
          </div>
          <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
            <table className="tabular w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">After</th>
                  <th className="px-4 py-2 text-right font-medium">{mode === 'cost' ? 'Costs' : 'Worth today'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {table.map((row) => (
                  <tr key={row.y}>
                    <td className="px-4 py-2">{row.y} {row.y === 1 ? 'year' : 'years'}</td>
                    <td className="px-4 py-2 text-right">{money(row.v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted">Uses a steady rate. Real inflation changes from year to year and differs between countries and types of spending.</p>
        </div>
      </div>
    </section>
  );
}
