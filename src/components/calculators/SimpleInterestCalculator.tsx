import { simpleInterest, type SolveFor } from '@/lib/calculators/savings';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { solve: 'interest', p: 10_000, r: 5, t: 3, tu: 'y', i: 1_500, cur: 'USD' };

const UNITS: Record<string, { label: string; perYear: number }> = {
  y: { label: 'years', perYear: 1 },
  m: { label: 'months', perYear: 12 },
  d: { label: 'days', perYear: 365 },
};

export default function SimpleInterestCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const solve = (['interest', 'principal', 'rate', 'time'].includes(s.solve) ? s.solve : 'interest') as SolveFor;
  const unit = UNITS[s.tu] ? s.tu : 'y';
  const years = s.t / UNITS[unit].perYear;
  const r = simpleInterest(solve, { principal: s.p, rate: s.r, years, interest: s.i });

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => (Number.isFinite(v) ? formatMoney(v, cur, 2) : '—');
  const timeShown = solve === 'time' ? r.years * UNITS[unit].perYear : s.t;
  const headline = {
    interest: ['Interest earned', money(r.interest)],
    principal: ['Principal needed', money(r.principal)],
    rate: ['Interest rate', Number.isFinite(r.rate) ? `${formatNumber(r.rate, 4)}% a year` : '—'],
    time: ['Time needed', Number.isFinite(timeShown) ? `${formatNumber(timeShown, 2)} ${UNITS[unit].label}` : '—'],
  }[solve];

  const years5 = [1, 2, 3, 5, 10].map((y) => ({ y, simple: r.principal * (1 + (r.rate / 100) * y), compound: r.principal * Math.pow(1 + r.rate / 100, y) }));

  return (
    <section aria-label="Simple interest calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">Work out the</p>
            <Tabs
              value={solve}
              onChange={(v) => set('solve', v)}
              tabs={[
                { value: 'interest', label: 'Interest' },
                { value: 'principal', label: 'Principal' },
                { value: 'rate', label: 'Rate' },
                { value: 'time', label: 'Time' },
              ]}
            />
          </div>
          {solve !== 'principal' && <NumberField label="Principal" value={s.p} onChange={(v) => set('p', v)} prefix={sym} locale={loc} min={0} decimals={2} />}
          {solve !== 'rate' && <NumberField label="Interest rate" value={s.r} onChange={(v) => set('r', v)} suffix="% per year" min={0} max={100} decimals={3} />}
          {solve !== 'interest' && <NumberField label="Interest" value={s.i} onChange={(v) => set('i', v)} prefix={sym} locale={loc} min={0} decimals={2} />}
          <div className="grid grid-cols-[minmax(0,1fr)_8rem] items-end gap-3">
            {solve !== 'time' ? <NumberField label="Time" value={s.t} onChange={(v) => set('t', v)} min={0} decimals={2} /> : <div />}
            <SelectField
              label={solve === 'time' ? 'Show time in' : 'Unit'}
              value={unit}
              onChange={(v) => set('tu', v)}
              options={Object.entries(UNITS).map(([k, u]) => ({ value: k, label: u.label }))}
            />
          </div>
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
          <Headline label={headline[0]} value={headline[1]} action={<ShareButton />} compact />
          <div className="mt-6">
            <StatGrid
              items={[
                ['Principal', money(r.principal)],
                ['Interest', money(r.interest)],
                ['Total amount', money(r.principal + r.interest)],
                ['Per year', money(r.principal * (r.rate / 100))],
              ]}
            />
          </div>
          <p className="tabular mt-4 text-sm text-muted">
            I = P × r × t = {money(r.principal)} × {formatNumber(r.rate, 4)}% × {formatNumber(r.years, 4)} years = {money(r.interest)}
          </p>

          {Number.isFinite(r.principal) && Number.isFinite(r.rate) && (
            <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
              <p className="border-b border-line px-4 py-2.5 text-sm font-semibold">Simple vs compound interest</p>
              <table className="tabular w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">After</th>
                    <th className="px-4 py-2 text-right font-medium">Simple</th>
                    <th className="px-4 py-2 text-right font-medium">Compound (yearly)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {years5.map((row) => (
                    <tr key={row.y}>
                      <td className="px-4 py-2">{row.y} {row.y === 1 ? 'year' : 'years'}</td>
                      <td className="px-4 py-2 text-right">{money(row.simple)}</td>
                      <td className="px-4 py-2 text-right">{money(row.compound)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
