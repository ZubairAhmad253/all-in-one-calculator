import { formatHM, shiftMinutes } from '@/lib/calculators/dates';
import { splitOvertime, type OvertimeRule } from '@/lib/calculators/pay';
import { CURRENCY_CODES, currencySymbol, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber, NumberField, SelectField } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { ShareButton, StatGrid } from './shared/results';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WORKDAY = '09:00-17:30-30';
const DEFAULTS = { days: [WORKDAY, WORKDAY, WORKDAY, WORKDAY, '08:30-18:30-30', '', ''].join(','), rate: 20, cur: 'USD', ot: 'weekly', mult: 1.5 };

interface Day {
  start: string;
  end: string;
  breakMin: number;
}

/** "09:00-17:30-30" per day; an empty entry is a day off. */
const decode = (text: string): (Day | null)[] => {
  const parts = text.split(',');
  return DAYS.map((_, i) => {
    const p = parts[i];
    if (!p) return null;
    const [start = '', end = '', brk = '0'] = p.split('-');
    return { start, end, breakMin: Number(brk) || 0 };
  });
};
const encode = (days: (Day | null)[]) => days.map((d) => (d ? `${d.start}-${d.end}-${Math.round(d.breakMin)}` : '')).join(',');

const RULES: { value: OvertimeRule; label: string }[] = [
  { value: 'weekly', label: 'Over 40 hours a week' },
  { value: 'daily', label: 'Over 8 hours a day' },
  { value: 'none', label: 'No overtime' },
];

const inputCls = 'tabular h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-2 text-sm font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/15';

export default function TimeCardCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const days = decode(s.days);
  const results = days.map((d) => (d ? shiftMinutes(d) : null));
  const minutes = results.map((r) => (r && !r.error ? r.minutes : 0));
  const rule = (RULES.some((r) => r.value === s.ot) ? s.ot : 'weekly') as OvertimeRule;
  const split = splitOvertime(minutes, rule);
  const mult = Math.max(1, s.mult);
  const cur = s.cur;
  const regularPay = (split.regular / 60) * s.rate;
  const overtimePay = (split.overtime / 60) * s.rate * mult;
  const daysWorked = minutes.filter((m) => m > 0).length;

  const update = (i: number, d: Day | null) => set('days', encode(days.map((x, j) => (j === i ? d : x))));

  return (
    <section aria-label="Time card calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="hidden grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_4.5rem_5rem] gap-2 px-1 pb-2 text-xs text-muted sm:grid">
            <span>Day</span>
            <span>Start</span>
            <span>End</span>
            <span>Break (min)</span>
            <span className="text-right">Hours</span>
          </div>
          <ol className="space-y-2">
            {days.map((d, i) => {
              const r = results[i];
              return (
                <li key={DAYS[i]} className="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 rounded-xl border border-line bg-surface p-2 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_4.5rem_5rem]">
                  <label className="flex items-center gap-1.5 text-sm font-semibold">
                    <input type="checkbox" checked={!!d} onChange={(e) => update(i, e.target.checked ? decode(WORKDAY)[0] : null)} className="size-4 accent-[var(--brand)]" aria-label={`Worked on ${DAYS[i]}`} />
                    {DAYS[i]}
                  </label>
                  {d ? (
                    <>
                      <input type="time" aria-label={`${DAYS[i]} start`} value={d.start} onChange={(e) => update(i, { ...d, start: e.target.value })} className={inputCls} />
                      <input type="time" aria-label={`${DAYS[i]} end`} value={d.end} onChange={(e) => update(i, { ...d, end: e.target.value })} className={inputCls} />
                      <div className="col-span-2 col-start-2 flex items-center gap-2 sm:col-span-1 sm:col-start-auto">
                        <span className="text-xs text-muted sm:hidden">Break</span>
                        <InlineNumber label={`${DAYS[i]} break in minutes`} value={d.breakMin} onChange={(v) => update(i, { ...d, breakMin: v })} width="w-full" allowNegative={false} />
                      </div>
                      <span className={`tabular text-right text-sm ${r?.error ? 'text-warn' : 'font-semibold'} col-start-3 row-start-2 sm:col-start-auto sm:row-start-auto`}>{r?.error ? 'Check' : formatHM(r?.minutes ?? 0).replace(' min', 'm').replace(' h ', 'h ')}</span>
                    </>
                  ) : (
                    <span className="col-span-2 text-sm text-muted sm:col-span-4">Day off</span>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => set('days', [WORKDAY, WORKDAY, WORKDAY, WORKDAY, WORKDAY, '', ''].join(','))} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Mon–Fri, 9 to 5:30
            </button>
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>
        <div className="space-y-5 bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Total pay this week</p>
              <p className="tabular mt-1 text-4xl font-bold tracking-tight">{formatMoney(regularPay + overtimePay, cur, 2)}</p>
              <p className="mt-1 text-sm text-muted">
                {formatHM(split.total)} ({formatNumber(split.total / 60, 2)} h) over {daysWorked} day{daysWorked === 1 ? '' : 's'}
              </p>
            </div>
            <ShareButton />
          </div>
          <StatGrid
            items={[
              ['Regular hours', `${formatNumber(split.regular / 60, 2)} h`],
              ['Overtime hours', `${formatNumber(split.overtime / 60, 2)} h`],
              ['Regular pay', formatMoney(regularPay, cur, 2)],
              [`Overtime pay (×${formatNumber(mult, 2)})`, formatMoney(overtimePay, cur, 2)],
            ]}
          />
          <div className="space-y-4 border-t border-line pt-5">
            <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-3">
              <NumberField label="Hourly rate" value={s.rate} onChange={(v) => set('rate', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} />
              <CurrencyPicker label="Currency" value={cur} onChange={(v) => set('cur', v)} codes={CURRENCY_CODES} />
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-3">
              <SelectField label="Overtime starts" value={rule} onChange={(v) => set('ot', v)} options={RULES} />
              <NumberField label="Rate ×" value={s.mult} onChange={(v) => set('mult', v)} min={1} max={5} decimals={2} />
            </div>
          </div>
          <p className="text-xs text-muted">Pay is before tax and deductions. Overtime rules vary by country, state and contract; check yours.</p>
        </div>
      </div>
    </section>
  );
}
