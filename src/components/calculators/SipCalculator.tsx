import { useMemo } from 'react';
import { sip } from '@/lib/calculators/growth';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatMoneyCompact, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { BreakdownDonut, GrowthPanel, Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = {
  monthly: 10_000,
  ret: 12,
  years: 10,
  step: 0,
  cur: 'INR',
};

export default function SipCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const r = useMemo(() => sip({ monthly: s.monthly, annualReturn: s.ret, years: s.years, stepUpPct: s.step }), [s.monthly, s.ret, s.years, s.step]);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);
  const multiple = r.totalDeposits > 0 ? r.finalBalance / r.totalDeposits : 0;

  return (
    <section aria-label="SIP calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Monthly investment" value={s.monthly} onChange={(v) => set('monthly', v)} prefix={sym} locale={loc} min={0} decimals={0} slider={{ min: 500, max: 200_000, step: 500 }} />
          <NumberField label="Expected return" value={s.ret} onChange={(v) => set('ret', v)} suffix="% per year" min={0} max={50} decimals={2} slider={{ min: 1, max: 30, step: 0.5 }} />
          <NumberField label="Investment period" value={s.years} onChange={(v) => set('years', v)} suffix="years" min={1} max={50} decimals={0} slider={{ min: 1, max: 40, step: 1 }} />
          <NumberField
            label="Annual step-up (optional)"
            value={s.step}
            onChange={(v) => set('step', v)}
            suffix="% per year"
            min={0}
            max={100}
            decimals={1}
            slider={{ min: 0, max: 25, step: 1 }}
            hint="Increase your monthly SIP by this much every year, e.g. in line with pay rises."
          />

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
          <Headline label="Estimated maturity value" value={money(r.finalBalance)} action={<ShareButton />} />

          <div className="mt-6">
            <BreakdownDonut
              segments={[
                { label: 'Amount invested', value: r.totalDeposits, color: 'var(--chart-1)' },
                { label: 'Estimated returns', value: r.totalInterest, color: 'var(--chart-2)' },
              ]}
              currency={cur}
              center={{ label: 'Maturity value', value: formatMoneyCompact(r.finalBalance, cur) }}
            />
          </div>

          <div className="mt-7">
            <StatGrid
              items={[
                ['Amount invested', money(r.totalDeposits)],
                ['Estimated returns', money(r.totalInterest)],
                ['Money multiplied', `${formatNumber(multiple, 2)}×`],
                s.step > 0 ? ['Monthly SIP in final year', money(r.finalMonthly)] : ['Number of instalments', formatNumber(Math.round(s.years * 12), 0)],
              ]}
            />
          </div>
        </div>
      </div>

      {r.yearly.length > 0 && (
        <GrowthPanel
          yearly={r.yearly}
          currency={cur}
          depositLabel="Amount invested"
          interestLabel="Estimated returns"
          note={`Assumes a steady ${formatNumber(s.ret, 2)}% yearly return (${formatNumber(s.ret / 12, 3)}% a month), with each instalment invested at the start of the month. Real market returns vary and are not guaranteed.`}
        />
      )}
    </section>
  );
}
