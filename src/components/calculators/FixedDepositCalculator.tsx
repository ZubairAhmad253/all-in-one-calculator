import { fixedDeposit, recurringDeposit } from '@/lib/calculators/savings';
import { CURRENCY_CODES, localeFor, currencySymbol, formatMoney, formatMoneyCompact, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs, TermField, type TermUnit } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { BreakdownDonut, Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { type: 'fd', amt: 100_000, rd: 5_000, rate: 7, term: 1, unit: 'y', comp: 4, cur: 'INR' };

export default function FixedDepositCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const type = s.type === 'rd' ? 'rd' : 'fd';
  const unit = s.unit as TermUnit;
  const months = Math.max(1, unit === 'y' ? Math.round(s.term * 12) : Math.round(s.term));
  const perYear = [1, 2, 4, 12].includes(s.comp) ? s.comp : 4;

  const fd = fixedDeposit(s.amt, s.rate, months, perYear);
  const rd = recurringDeposit(s.rd, s.rate, months);
  const deposited = type === 'fd' ? s.amt : rd.deposited;
  const maturity = type === 'fd' ? fd.maturity : rd.maturity;
  const interest = maturity - deposited;

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);

  return (
    <section aria-label="Fixed deposit calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">Deposit type</p>
            <Tabs
              value={type}
              onChange={(v) => set('type', v)}
              tabs={[
                { value: 'fd', label: 'Fixed deposit (FD)' },
                { value: 'rd', label: 'Recurring deposit (RD)' },
              ]}
            />
          </div>
          {type === 'fd' ? (
            <NumberField label="Deposit amount" value={s.amt} onChange={(v) => set('amt', v)} prefix={sym} locale={loc} min={0} decimals={0} slider={{ min: 10_000, max: 5_000_000, step: 10_000 }} />
          ) : (
            <NumberField label="Monthly deposit" value={s.rd} onChange={(v) => set('rd', v)} prefix={sym} locale={loc} min={0} decimals={0} slider={{ min: 500, max: 100_000, step: 500 }} />
          )}
          <NumberField label="Interest rate" value={s.rate} onChange={(v) => set('rate', v)} suffix="% per year" min={0} max={20} decimals={2} slider={{ min: 3, max: 10, step: 0.05 }} />
          <TermField
            label="Tenure"
            value={s.term}
            unit={unit}
            onChange={(v) => set('term', v)}
            onUnitChange={(u, v) => {
              set('unit', u);
              set('term', v);
            }}
            maxYears={20}
          />
          {type === 'fd' ? (
            <SelectField
              label="Interest compounded"
              value={perYear}
              onChange={(v) => set('comp', v)}
              options={[
                { value: 4, label: 'Quarterly (most banks)' },
                { value: 12, label: 'Monthly' },
                { value: 2, label: 'Half-yearly' },
                { value: 1, label: 'Yearly' },
              ]}
            />
          ) : (
            <p className="text-xs text-muted">RD interest is compounded quarterly, the method used by most Indian banks.</p>
          )}
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
          <Headline label="Maturity value" value={money(maturity)} action={<ShareButton />} />
          <div className="mt-6">
            <BreakdownDonut
              segments={[
                { label: 'Amount deposited', value: deposited, color: 'var(--chart-1)' },
                { label: 'Interest earned', value: interest, color: 'var(--chart-2)' },
              ]}
              currency={cur}
              center={{ label: 'Maturity', value: formatMoneyCompact(maturity, cur) }}
            />
          </div>
          <div className="mt-7">
            <StatGrid
              items={[
                ['Interest earned', money(interest)],
                ['Tenure', `${formatNumber(months, 0)} months`],
                ...(type === 'fd'
                  ? ([
                      ['Effective annual yield', `${formatNumber(fd.effectiveYield, 3)}%`],
                      ['Interest per year (avg)', money(interest / (months / 12))],
                    ] as [string, string][])
                  : ([
                      ['Total deposited', money(deposited)],
                      ['Instalments', formatNumber(months, 0)],
                    ] as [string, string][])),
              ]}
            />
          </div>
          <p className="mt-4 text-xs text-muted">Before tax. Interest on deposits is usually taxable, and banks may deduct tax at source (TDS) above a threshold.</p>
        </div>
      </div>
    </section>
  );
}
