import { useMemo, useState } from 'react';
import { calculateMortgage } from '@/lib/calculators/mortgage';
import { CURRENCIES, localeFor, currencySymbol, formatDuration, formatMoney, formatMoneyCompact, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, TermField, type TermUnit } from '@/components/ui/fields';
import { AmortizationPanel, BreakdownDonut, Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = {
  price: 400_000,
  down: 80_000,
  rate: 6.5,
  term: 30,
  unit: 'y',
  tax: 1.1,
  ins: 1_500,
  hoa: 0,
  extra: 0,
  cur: 'USD',
};

export default function MortgageCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const [showMore, setShowMore] = useState(false);
  const unit = s.unit as TermUnit;
  const termYears = unit === 'y' ? s.term : s.term / 12;

  const r = useMemo(
    () =>
      calculateMortgage({
        homePrice: s.price,
        downPayment: Math.min(s.down, s.price),
        annualRate: s.rate,
        termYears,
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

  return (
    <section aria-label="Mortgage calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Inputs */}
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Home price" value={s.price} onChange={(v) => set('price', v)} prefix={sym} locale={localeFor(cur)} min={0} decimals={0} slider={{ min: 50_000, max: 2_000_000, step: 5_000 }} />

          <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
            <NumberField label="Down payment" value={s.down} onChange={(v) => set('down', v)} prefix={sym} locale={localeFor(cur)} min={0} decimals={0} />
            <NumberField label="Percent" value={Number(downPct.toFixed(2))} onChange={(v) => set('down', Math.round((s.price * v) / 100))} suffix="%" min={0} max={100} />
          </div>
          {downPct < 20 && s.price > 0 && (
            <p className="-mt-2 rounded-lg bg-warn/10 px-3 py-2 text-xs text-warn">
              Many lenders charge mortgage insurance (PMI) when the down payment is under 20%.
            </p>
          )}

          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Interest rate" value={s.rate} onChange={(v) => set('rate', v)} suffix="%" min={0} max={30} decimals={3} slider={{ min: 0, max: 15, step: 0.125 }} />
            <TermField
              value={s.term}
              unit={unit}
              onChange={(v) => set('term', v)}
              onUnitChange={(u, v) => {
                set('unit', u);
                set('term', v);
              }}
            />
          </div>

          <button type="button" onClick={() => setShowMore((v) => !v)} className="text-sm font-medium text-brand" aria-expanded={showMore}>
            {showMore ? '− Hide' : '+ Add'} taxes, insurance and extra payments
          </button>

          {showMore && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Property tax" value={s.tax} onChange={(v) => set('tax', v)} suffix="%/yr" min={0} max={10} hint={`${money(r.tax * 12)} per year`} />
                <NumberField label="Home insurance" value={s.ins} onChange={(v) => set('ins', v)} prefix={sym} locale={localeFor(cur)} suffix="/yr" min={0} decimals={0} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="HOA / service fee" value={s.hoa} onChange={(v) => set('hoa', v)} prefix={sym} locale={localeFor(cur)} suffix="/mo" min={0} decimals={0} />
                <NumberField label="Extra payment" value={s.extra} onChange={(v) => set('extra', v)} prefix={sym} locale={localeFor(cur)} suffix="/mo" min={0} decimals={0} />
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
          <Headline label="Monthly payment" value={money(r.monthlyTotal)} action={<ShareButton />} />

          <div className="mt-6">
            <BreakdownDonut segments={segments} currency={cur} center={{ label: 'Loan', value: formatMoneyCompact(r.loanAmount, cur) }} />
          </div>

          <div className="mt-7">
            <StatGrid
              items={[
                ['Loan amount', money(r.loanAmount)],
                ['Total interest', money(r.totalInterest)],
                ['Total of payments', money(r.totalPaid)],
                ['Paid off in', formatDuration(r.months)],
              ]}
            />
          </div>

          {s.extra > 0 && r.interestSaved > 0 && (
            <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm">
              Paying <strong>{money(s.extra)}</strong> extra each month saves <strong>{money(r.interestSaved)}</strong> in interest and clears the loan{' '}
              <strong>{formatDuration(r.monthsSaved)}</strong> sooner.
            </p>
          )}
        </div>
      </div>

      {r.loanAmount > 0 && (
        <AmortizationPanel
          principal={r.loanAmount}
          yearly={r.schedule}
          currency={cur}
          note={`Based on a fixed rate of ${formatNumber(s.rate, 3)}% over ${formatDuration(Math.round(termYears * 12))}. Actual payments vary with your lender, fees and local taxes.`}
        />
      )}
    </section>
  );
}
