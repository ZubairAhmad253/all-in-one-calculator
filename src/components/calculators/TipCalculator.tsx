import { useMemo } from 'react';
import { tip, type TipRounding } from '@/lib/calculators/shopping';
import { CURRENCIES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, QuickPicks, SelectField } from '@/components/ui/fields';
import { Headline, Receipt, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = {
  bill: 85,
  pct: 18,
  people: 1,
  round: 'none',
  cur: 'USD',
};

const ROUNDING: { value: TipRounding; label: string }[] = [
  { value: 'none', label: 'Don’t round' },
  { value: 'person', label: 'Round each person up' },
  { value: 'total', label: 'Round the total up' },
];

export default function TipCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const rounding = (ROUNDING.some((o) => o.value === s.round) ? s.round : 'none') as TipRounding;
  const people = Math.max(1, Math.floor(s.people) || 1);
  const r = useMemo(() => tip({ bill: s.bill, tipPct: s.pct, people, rounding }), [s.bill, s.pct, people, rounding]);

  const cur = s.cur;
  const money = (v: number) => formatMoney(v, cur, 2);
  const split = people > 1;

  return (
    <section aria-label="Tip calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <NumberField label="Bill amount" value={s.bill} onChange={(v) => set('bill', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} />

          <div>
            <NumberField label="Tip" value={s.pct} onChange={(v) => set('pct', v)} suffix="%" min={0} max={100} decimals={2} />
            <QuickPicks label="Common tip percentages" values={[10, 15, 18, 20, 25]} value={s.pct} onPick={(v) => set('pct', v)} />
          </div>

          <NumberField label="Split between" value={people} onChange={(v) => set('people', v)} suffix={people === 1 ? 'person' : 'people'} min={1} max={100} decimals={0} slider={{ min: 1, max: 20, step: 1 }} />

          <SelectField label="Rounding" value={rounding} onChange={(v) => set('round', v)} options={ROUNDING} />

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
          <Headline label={split ? 'Each person pays' : 'Total to pay'} value={money(split ? r.totalPerPerson : r.total)} action={<ShareButton />} />

          <div className="mt-6">
            <Receipt
              lines={[
                { label: 'Bill', value: money(s.bill) },
                { label: `Tip (${formatNumber(r.effectivePct, 2)}%)`, value: `+ ${money(r.tip)}` },
              ]}
              total={{ label: 'Total', value: money(r.total) }}
            />
          </div>

          <div className="mt-5">
            <StatGrid
              items={
                split
                  ? [
                      ['Tip per person', money(r.tipPerPerson)],
                      ['Total per person', money(r.totalPerPerson)],
                    ]
                  : [
                      ['Tip amount', money(r.tip)],
                      ['Total with tip', money(r.total)],
                    ]
              }
            />
          </div>

          {rounding !== 'none' && Math.abs(r.effectivePct - s.pct) > 0.005 && (
            <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm">
              Rounding up makes the tip {money(r.tip)}, which is {formatNumber(r.effectivePct, 2)}% of the bill instead of {formatNumber(s.pct, 2)}%.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
