import { useMemo } from 'react';
import { calculateLoan } from '@/lib/calculators/loan';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatMoneyCompact, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, TermField, Tabs, type TermUnit } from '@/components/ui/fields';
import { AmortizationPanel, BreakdownDonut, Headline, ShareButton, StatGrid } from './shared/results';

/** Typical starting values per loan type, so one click gives a realistic example. */
type Preset = 'home' | 'car' | 'personal';
const PRESETS: Record<Preset, { amount: number; rate: number; term: number }> = {
  home: { amount: 5_000_000, rate: 8.5, term: 20 },
  car: { amount: 800_000, rate: 9.5, term: 5 },
  personal: { amount: 300_000, rate: 13, term: 3 },
};

const DEFAULTS = {
  type: 'home',
  amount: PRESETS.home.amount,
  rate: PRESETS.home.rate,
  term: PRESETS.home.term,
  unit: 'y',
  cur: 'INR',
};

export default function EmiCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const unit = s.unit as TermUnit;
  const months = unit === 'y' ? s.term * 12 : s.term;
  const r = useMemo(() => calculateLoan(s.amount, s.rate, months), [s.amount, s.rate, months]);

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const money = (v: number) => formatMoney(v, cur);
  const interestShare = r.totalPaid > 0 ? (r.totalInterest / r.totalPaid) * 100 : 0;

  const applyPreset = (p: Preset) => {
    set('type', p);
    set('amount', PRESETS[p].amount);
    set('rate', PRESETS[p].rate);
    set('term', PRESETS[p].term);
    set('unit', 'y');
  };

  return (
    <section aria-label="EMI calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">Loan type</p>
            <Tabs
              value={s.type as Preset}
              onChange={applyPreset}
              tabs={[
                { value: 'home', label: 'Home' },
                { value: 'car', label: 'Car' },
                { value: 'personal', label: 'Personal' },
              ]}
            />
          </div>

          <NumberField label="Loan amount" value={s.amount} onChange={(v) => set('amount', v)} prefix={sym} locale={localeFor(cur)} min={0} decimals={0} slider={{ min: 10_000, max: 20_000_000, step: 10_000 }} />
          <NumberField label="Interest rate" value={s.rate} onChange={(v) => set('rate', v)} suffix="% per year" min={0} max={60} decimals={3} slider={{ min: 1, max: 30, step: 0.1 }} />
          <TermField
            label="Loan tenure"
            value={s.term}
            unit={unit}
            onChange={(v) => set('term', v)}
            onUnitChange={(u, v) => {
              set('unit', u);
              set('term', v);
            }}
            maxYears={30}
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
          <Headline label="Monthly EMI" value={formatMoney(r.payment, cur, 2)} action={<ShareButton />} />

          <div className="mt-6">
            <BreakdownDonut
              segments={[
                { label: 'Principal amount', value: s.amount, color: 'var(--chart-1)' },
                { label: 'Total interest', value: r.totalInterest, color: 'var(--chart-3)' },
              ]}
              currency={cur}
              center={{ label: 'Total payable', value: formatMoneyCompact(r.totalPaid, cur) }}
            />
          </div>

          <div className="mt-7">
            <StatGrid
              items={[
                ['Total interest', money(r.totalInterest)],
                ['Total amount payable', money(r.totalPaid)],
                ['Number of EMIs', formatNumber(r.months, 0)],
                ['Interest share of total', `${formatNumber(interestShare, 1)}%`],
              ]}
            />
          </div>
        </div>
      </div>

      {s.amount > 0 && (
        <AmortizationPanel
          principal={s.amount}
          yearly={r.yearly}
          monthly={r.monthly}
          currency={cur}
          defaultView="yearly"
          note={`Assumes a fixed rate of ${formatNumber(s.rate, 3)}% on a reducing balance with ${formatNumber(months, 0)} monthly EMIs. Processing fees and insurance are not included.`}
        />
      )}
    </section>
  );
}
