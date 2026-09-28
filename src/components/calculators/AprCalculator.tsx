import { useMemo } from 'react';
import { apr } from '@/lib/calculators/debt';
import { CURRENCY_CODES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, TermField, type TermUnit } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { amount: 10_000, rate: 8, term: 3, unit: 'y', fees: 300, fin: 0, cur: 'USD' };

export default function AprCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const unit = s.unit as TermUnit;
  const months = unit === 'y' ? Math.round(s.term * 12) : Math.round(s.term);
  const r = useMemo(() => apr({ amount: s.amount, rate: s.rate, months, fees: s.fees, feesFinanced: s.fin === 1 }), [s.amount, s.rate, months, s.fees, s.fin]);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);
  const gap = r.apr - s.rate;

  return (
    <section aria-label="APR calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Loan amount" value={s.amount} onChange={(v) => set('amount', v)} prefix={sym} locale={loc} min={0} decimals={0} />
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Interest rate" value={s.rate} onChange={(v) => set('rate', v)} suffix="%" min={0} max={60} decimals={3} />
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
          <NumberField
            label="Upfront fees"
            value={s.fees}
            onChange={(v) => set('fees', v)}
            prefix={sym}
            locale={loc}
            min={0}
            decimals={0}
            hint="Origination, arrangement, processing or broker fees, and mortgage points."
          />
          <SelectField
            label="How the fees are paid"
            value={s.fin}
            onChange={(v) => set('fin', v)}
            options={[
              { value: 0, label: 'Deducted from the loan or paid upfront' },
              { value: 1, label: 'Added to the loan amount' },
            ]}
          />
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
          <Headline label="APR (true yearly cost)" value={Number.isFinite(r.apr) ? `${formatNumber(r.apr, 3)}%` : '—'} action={<ShareButton />} />
          {Number.isFinite(r.apr) && (
            <p className="mt-2 text-sm">
              {gap > 0.0005 ? (
                <>
                  That’s <strong>{formatNumber(gap, 3)} points higher</strong> than the {formatNumber(s.rate, 3)}% interest rate, because of the fees.
                </>
              ) : (
                'With no fees, the APR equals the interest rate.'
              )}
            </p>
          )}
          <div className="mt-6">
            <StatGrid
              items={[
                ['Monthly payment', formatMoney(r.payment, cur, 2)],
                ['Total interest', money(r.totalInterest)],
                ['Fees', money(s.fees)],
                ['Total cost of borrowing', money(r.totalCost)],
              ]}
            />
          </div>
          <p className="mt-4 text-xs text-muted">
            Calculated the US way (Truth in Lending): the monthly rate that repays the money you actually receive, times 12. EU and UK lenders quote an “APRC”, which compounds
            the rate and comes out slightly higher.
          </p>
        </div>
      </div>
    </section>
  );
}
