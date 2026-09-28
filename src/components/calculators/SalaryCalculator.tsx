import { convertPay, PAY_PERIODS, workYear, type PayPeriod } from '@/lib/calculators/pay';
import { CURRENCY_CODES, localeFor, currencySymbol, formatMoney, formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { Headline, ShareButton } from './shared/results';

const DEFAULTS = { amt: 25, per: 'hour', hpw: 40, dpw: 5, unpaid: 0, tax: 0, cur: 'USD' };

const LABELS: Record<PayPeriod, string> = {
  hour: 'Hourly',
  day: 'Daily',
  week: 'Weekly',
  biweek: 'Every 2 weeks',
  semimonth: 'Twice a month',
  month: 'Monthly',
  year: 'Yearly',
};

/** Labels for the "per" dropdown: "5 per hour". */
const PER: Record<PayPeriod, string> = { hour: 'hour', day: 'day', week: 'week', biweek: '2 weeks', semimonth: 'half month', month: 'month', year: 'year' };

export default function SalaryCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const period = (PAY_PERIODS as readonly string[]).includes(s.per) ? (s.per as PayPeriod) : 'hour';
  const pattern = { hoursPerWeek: s.hpw, daysPerWeek: s.dpw, unpaidDays: s.unpaid };
  const pay = convertPay(s.amt, period, pattern);
  const work = workYear(pattern);
  const keep = 1 - Math.min(Math.max(s.tax, 0), 100) / 100;

  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur, 2);

  return (
    <section aria-label="Salary calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="grid grid-cols-[minmax(0,1fr)_10rem] items-end gap-3">
            <NumberField label="Pay" value={s.amt} onChange={(v) => set('amt', v)} prefix={sym} locale={loc} min={0} decimals={2} />
            <SelectField label="Per" value={period} onChange={(v) => set('per', v)} options={PAY_PERIODS.map((p) => ({ value: p, label: PER[p] }))} />
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Hours per week" value={s.hpw} onChange={(v) => set('hpw', v)} min={0} max={168} decimals={1} />
            <NumberField label="Days per week" value={s.dpw} onChange={(v) => set('dpw', v)} min={0} max={7} decimals={1} />
          </div>
          <NumberField label="Unpaid days off a year" value={s.unpaid} onChange={(v) => set('unpaid', v)} suffix="days" min={0} max={365} decimals={0} hint="Leave out paid holidays and paid leave; only count days you aren’t paid for." />
          <NumberField
            label="Estimated tax and deductions (optional)"
            value={s.tax}
            onChange={(v) => set('tax', v)}
            suffix="%"
            min={0}
            max={100}
            decimals={1}
            hint="A single overall percentage for a rough take-home figure."
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
          <Headline label="Yearly salary" value={formatMoney(pay.year, cur)} action={<ShareButton />} />
          <p className="mt-1 text-sm text-muted">
            Based on {formatNumber(work.hours, 0)} paid hours over {formatNumber(work.days, 0)} working days a year.
          </p>
          <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
            <table className="tabular w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Pay period</th>
                  <th className="px-4 py-2.5 text-right font-medium">Before tax</th>
                  {s.tax > 0 && <th className="px-4 py-2.5 text-right font-medium">Take-home</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {PAY_PERIODS.map((p) => (
                  <tr key={p} className={p === period ? 'bg-brand-soft/60 font-semibold' : ''}>
                    <td className="px-4 py-2.5">{LABELS[p]}</td>
                    <td className="px-4 py-2.5 text-right">{money(pay[p])}</td>
                    {s.tax > 0 && <td className="px-4 py-2.5 text-right">{money(pay[p] * keep)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted">
            Uses 52 weeks a year. Take-home pay is a rough estimate from a single percentage; real income tax and deductions depend on where you live and your circumstances.
          </p>
        </div>
      </div>
    </section>
  );
}
