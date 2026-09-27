import { useId } from 'react';
import { decimalHours, formatHM, shiftMinutes, type Shift } from '@/lib/calculators/dates';
import { CURRENCIES, currencySymbol, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber, NumberField, SelectField } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULT_SHIFT = '09:00-17:30-30';
const DEFAULTS = { shifts: [DEFAULT_SHIFT, DEFAULT_SHIFT, DEFAULT_SHIFT].join(','), rate: 0, cur: 'USD' };
const MAX_SHIFTS = 14;

/** Shifts live in the URL as "09:00-17:30-30,22:00-06:00-45". */
const decode = (text: string): Shift[] =>
  text
    .split(',')
    .filter(Boolean)
    .slice(0, MAX_SHIFTS)
    .map((part) => {
      const [start = '', end = '', brk = '0'] = part.split('-');
      return { start, end, breakMin: Number(brk) || 0 };
    });
const encode = (shifts: Shift[]) => shifts.map((s) => `${s.start}-${s.end}-${Math.round(s.breakMin)}`).join(',');

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs text-muted">
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tabular h-11 w-full rounded-xl border border-line bg-surface px-3 text-base font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
    </div>
  );
}

export default function HoursWorkedCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const shifts = decode(s.shifts);
  const results = shifts.map(shiftMinutes);
  const totalMin = results.reduce((sum, r) => sum + r.minutes, 0);
  const hours = decimalHours(totalMin);
  const cur = s.cur;

  const update = (i: number, patch: Partial<Shift>) => set('shifts', encode(shifts.map((sh, j) => (j === i ? { ...sh, ...patch } : sh))));
  const remove = (i: number) => set('shifts', encode(shifts.filter((_, j) => j !== i)));
  const add = (sh: Shift) => shifts.length < MAX_SHIFTS && set('shifts', encode([...shifts, sh]));

  return (
    <section aria-label="Hours worked calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <ol className="space-y-3">
            {shifts.map((sh, i) => {
              const r = results[i];
              return (
                <li key={i} className="rounded-xl border border-line bg-surface p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Shift {i + 1}</p>
                    <div className="flex items-center gap-3">
                      <span className={`tabular text-sm ${r.error ? 'text-warn' : 'font-semibold'}`}>
                        {r.error ?? formatHM(r.minutes)}
                        {!r.error && r.overnight && <span className="ml-1 text-xs font-normal text-muted">(overnight)</span>}
                      </span>
                      {shifts.length > 1 && (
                        <button type="button" onClick={() => remove(i)} aria-label={`Remove shift ${i + 1}`} className="grid size-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem]">
                    <TimeInput label="Start" value={sh.start} onChange={(v) => update(i, { start: v })} />
                    <TimeInput label="End" value={sh.end} onChange={(v) => update(i, { end: v })} />
                    <div className="col-span-2 sm:col-span-1">
                      <span className="mb-1 block text-xs text-muted">Unpaid break (min)</span>
                      <InlineNumber label={`Shift ${i + 1} unpaid break in minutes`} value={sh.breakMin} onChange={(v) => update(i, { breakMin: v })} width="w-full" allowNegative={false} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => add(shifts.at(-1) ?? decode(DEFAULT_SHIFT)[0])}
              disabled={shifts.length >= MAX_SHIFTS}
              className="h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-brand/40 disabled:opacity-50"
            >
              + Add shift
            </button>
            <button type="button" onClick={() => set('shifts', encode(Array(5).fill(decode(DEFAULT_SHIFT)[0])))} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              5-day week, 9 to 5:30
            </button>
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-5 bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <Headline label="Total hours worked" value={formatHM(totalMin)} action={<ShareButton />} compact />
          <StatGrid
            items={[
              ['Decimal hours', formatNumber(hours, 2)],
              ['Shifts', formatNumber(shifts.length, 0)],
              ['Average per shift', formatHM(shifts.length ? totalMin / shifts.length : 0)],
              ['Over 40 hours', hours > 40 ? formatHM(totalMin - 40 * 60) : 'None'],
            ]}
          />

          <div className="border-t border-line pt-5">
            <p className="text-sm font-semibold">Pay (optional)</p>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_8rem] items-end gap-3">
              <NumberField label="Hourly rate" value={s.rate} onChange={(v) => set('rate', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} />
              <SelectField label="Currency" value={cur} onChange={(v) => set('cur', v)} options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))} />
            </div>
            {s.rate > 0 && (
              <p className="tabular mt-4 text-2xl font-bold">
                {formatMoney(hours * s.rate, cur, 2)} <span className="text-sm font-medium text-muted">before tax</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
