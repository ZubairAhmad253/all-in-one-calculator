import { useMemo, useState } from 'react';
import { calculateMortgage } from '@/lib/calculators/mortgage';
import { CURRENCIES, currencySymbol, formatDuration, formatMoney, formatMoneyCompact, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { Donut } from '@/components/charts/Donut';
import { LineChart } from '@/components/charts/LineChart';

const DEFAULTS = {
  price: 400_000,
  down: 80_000,
  rate: 6.5,
  term: 30,
  tax: 1.1,
  ins: 1_500,
  hoa: 0,
  extra: 0,
  cur: 'USD',
};

const TERMS = [10, 15, 20, 25, 30, 35, 40].map((y) => ({ value: y, label: `${y} years` }));

export default function MortgageCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [showMore, setShowMore] = useState(false);
  const [copied, setCopied] = useState(false);

  const r = useMemo(
    () =>
      calculateMortgage({
        homePrice: s.price,
        downPayment: Math.min(s.down, s.price),
        annualRate: s.rate,
        termYears: s.term,
        propertyTaxRate: s.tax,
        insurancePerYear: s.ins,
        hoaPerMonth: s.hoa,
        extraPerMonth: s.extra,
      }),
    [s],
  );

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const money = (v: number, d = 0) => formatMoney(v, cur, d);
  const downPct = s.price > 0 ? (s.down / s.price) * 100 : 0;

  const segments = [
    { label: 'Principal & interest', value: r.principalAndInterest, color: 'var(--chart-1)' },
    { label: 'Property tax', value: r.tax, color: 'var(--chart-2)' },
    { label: 'Insurance', value: r.insurance, color: 'var(--chart-3)' },
    { label: 'HOA', value: r.hoa, color: 'var(--chart-4)' },
  ];

  let cumInterest = 0;
  let cumPrincipal = 0;
  const chartRows = [{ year: 0, balance: r.loanAmount, interest: 0, principal: 0 }].concat(
    r.schedule.map((row) => ({
      year: row.year,
      balance: row.balance,
      interest: (cumInterest += row.interest),
      principal: (cumPrincipal += row.principal),
    })),
  );

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard blocked: the URL bar already holds the shareable link. */
    }
  };

  return (
    <section aria-label="Mortgage calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Inputs */}
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Home price" value={s.price} onChange={(v) => set('price', v)} prefix={sym} min={0} decimals={0} slider={{ min: 50_000, max: 2_000_000, step: 5_000 }} />

          <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
            <NumberField label="Down payment" value={s.down} onChange={(v) => set('down', v)} prefix={sym} min={0} decimals={0} />
            <NumberField label="Percent" value={Number(downPct.toFixed(2))} onChange={(v) => set('down', Math.round((s.price * v) / 100))} suffix="%" min={0} max={100} />
          </div>
          {downPct < 20 && s.price > 0 && (
            <p className="-mt-2 rounded-lg bg-warn/10 px-3 py-2 text-xs text-warn">
              Many lenders charge mortgage insurance (PMI) when the down payment is under 20%.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Interest rate" value={s.rate} onChange={(v) => set('rate', v)} suffix="%" min={0} max={30} decimals={3} />
            <SelectField label="Loan term" value={s.term} onChange={(v) => set('term', v)} options={TERMS} />
          </div>

          <button type="button" onClick={() => setShowMore((v) => !v)} className="text-sm font-medium text-brand" aria-expanded={showMore}>
            {showMore ? '− Hide' : '+ Add'} taxes, insurance and extra payments
          </button>

          {showMore && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Property tax" value={s.tax} onChange={(v) => set('tax', v)} suffix="%/yr" min={0} max={10} hint={`${money(r.tax * 12)} per year`} />
                <NumberField label="Home insurance" value={s.ins} onChange={(v) => set('ins', v)} prefix={sym} suffix="/yr" min={0} decimals={0} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="HOA / service fee" value={s.hoa} onChange={(v) => set('hoa', v)} prefix={sym} suffix="/mo" min={0} decimals={0} />
                <NumberField label="Extra payment" value={s.extra} onChange={(v) => set('extra', v)} prefix={sym} suffix="/mo" min={0} decimals={0} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-3 border-t border-line pt-5">
            <div className="min-w-40 flex-1">
              <SelectField label="Currency" value={cur} onChange={(v) => set('cur', v)} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} – ${c.label}` }))} />
            </div>
            <button type="button" onClick={reset} className="h-12 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Monthly payment</p>
              <p className="tabular mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{money(r.monthlyTotal)}</p>
            </div>
            <button type="button" onClick={share} className="shrink-0 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90">
              {copied ? 'Link copied' : 'Share result'}
            </button>
          </div>

          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
            <Donut segments={segments} size={168}>
              <div>
                <p className="text-xs text-muted">Loan</p>
                <p className="tabular text-sm font-semibold">{formatMoneyCompact(r.loanAmount, cur)}</p>
              </div>
            </Donut>
            <ul className="w-full flex-1 space-y-2.5 text-sm">
              {segments.map((seg) => (
                <li key={seg.label} className="flex items-center gap-2.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: seg.color }} />
                  <span className="text-muted">{seg.label}</span>
                  <span className="tabular ml-auto font-medium">{money(seg.value)}</span>
                </li>
              ))}
            </ul>
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-3">
            {[
              ['Loan amount', money(r.loanAmount)],
              ['Total interest', money(r.totalInterest)],
              ['Total of payments', money(r.totalPaid)],
              ['Paid off in', formatDuration(r.months)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-surface p-3.5">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="tabular mt-1 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {s.extra > 0 && r.interestSaved > 0 && (
            <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm">
              Paying <strong>{money(s.extra)}</strong> extra each month saves <strong>{money(r.interestSaved)}</strong> in interest and clears the loan{' '}
              <strong>{formatDuration(r.monthsSaved)}</strong> sooner.
            </p>
          )}
        </div>
      </div>

      {/* Schedule */}
      {r.loanAmount > 0 && (
        <div className="border-t border-line p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Amortization</h2>
            <Tabs
              value={view}
              onChange={setView}
              tabs={[
                { value: 'chart', label: 'Chart' },
                { value: 'table', label: 'Schedule' },
              ]}
            />
          </div>

          {view === 'chart' ? (
            <div className="mt-5">
              <LineChart
                labels={chartRows.map((row) => row.year)}
                xTitle="Year"
                formatY={(v) => formatMoneyCompact(v, cur)}
                formatTooltip={(v) => money(v)}
                series={[
                  { label: 'Remaining balance', color: 'var(--chart-1)', values: chartRows.map((row) => row.balance), area: true },
                  { label: 'Principal paid', color: 'var(--chart-2)', values: chartRows.map((row) => row.principal) },
                  { label: 'Interest paid', color: 'var(--chart-3)', values: chartRows.map((row) => row.interest) },
                ]}
              />
            </div>
          ) : (
            <div className="mt-5 max-h-[28rem] overflow-auto rounded-xl border border-line">
              <table className="tabular w-full text-sm">
                <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Year</th>
                    <th className="px-4 py-2.5 text-right font-medium">Principal</th>
                    <th className="px-4 py-2.5 text-right font-medium">Interest</th>
                    <th className="px-4 py-2.5 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {r.schedule.map((row) => (
                    <tr key={row.year}>
                      <td className="px-4 py-2">{row.year}</td>
                      <td className="px-4 py-2 text-right">{money(row.principal)}</td>
                      <td className="px-4 py-2 text-right">{money(row.interest)}</td>
                      <td className="px-4 py-2 text-right font-medium">{money(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted">
            Based on a fixed rate of {formatNumber(s.rate, 3)}% over {s.term} years. Actual payments vary with your lender, fees and local taxes.
          </p>
        </div>
      )}
    </section>
  );
}
