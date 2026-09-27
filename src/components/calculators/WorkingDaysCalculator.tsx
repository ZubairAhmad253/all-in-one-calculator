import { useId } from 'react';
import { addDays, countWorkDays, isIsoDate, WEEKDAYS, type IsoDate } from '@/lib/calculators/dates';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { useToday } from '@/lib/hooks/useToday';
import { NumberField, SelectField } from '@/components/ui/fields';
import { DateField } from './shared/body';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { from: '', to: '', wk: '0,6', hol: '', inc: 'yes', hpd: 8 };

const WEEKENDS = [
  { value: '0,6', label: 'Saturday and Sunday' },
  { value: '5,6', label: 'Friday and Saturday' },
  { value: '5', label: 'Friday only' },
  { value: '0', label: 'Sunday only' },
  { value: '6', label: 'Saturday only' },
];

const short = (d: IsoDate) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Pull YYYY-MM-DD dates out of free text. */
const parseDates = (text: string) => [...new Set(text.match(/\d{4}-\d{2}-\d{2}/g) ?? [])].filter(isIsoDate);

export default function WorkingDaysCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const today = useToday();
  const holId = useId();
  const from = isIsoDate(s.from) ? s.from : today;
  const to = isIsoDate(s.to) ? s.to : today ? addDays(today, 30) : null;
  const weekendKey = WEEKENDS.some((w) => w.value === s.wk) ? s.wk : '0,6';
  const weekend = weekendKey.split(',').map(Number);
  const holidays = parseDates(s.hol);
  const inclusive = s.inc !== 'no';
  const r = from && to ? countWorkDays(from, to, { weekend, holidays }, inclusive) : null;
  const holidaysInRange = from && to ? holidays.filter((h) => (h >= from && h <= to) || (h >= to && h <= from)) : [];
  const total = r ? r.workDays + r.weekendDays + r.holidays : 0;

  return (
    <section aria-label="Working days calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="grid grid-cols-2 items-start gap-3">
            <DateField label="Start date" value={from ?? ''} onChange={(v) => set('from', v)} />
            <DateField label="End date" value={to ?? ''} onChange={(v) => set('to', v)} />
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={inclusive} onChange={(e) => set('inc', e.target.checked ? 'yes' : 'no')} className="size-4 accent-[var(--brand)]" />
            Include the end date
          </label>
          <SelectField label="Weekend days" value={weekendKey} onChange={(v) => set('wk', v)} options={WEEKENDS} />
          <div>
            <label htmlFor={holId} className="mb-1.5 block text-sm font-medium">
              Holidays to exclude (optional)
            </label>
            <textarea
              id={holId}
              rows={3}
              value={s.hol}
              placeholder="2026-12-25, 2026-12-26"
              onChange={(e) => set('hol', e.target.value)}
              className="tabular w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-3 text-base font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
            <p className="mt-1.5 text-xs text-muted">Dates as YYYY-MM-DD, separated by commas or new lines. Holidays on weekends are ignored.</p>
          </div>
          <NumberField label="Hours per working day" value={s.hpd} onChange={(v) => set('hpd', v)} min={0} max={24} decimals={2} suffix="h" />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!r || !from || !to ? (
            <p className="text-sm text-muted">Loading today’s date…</p>
          ) : (
            <>
              <Headline label="Working days" value={r.workDays.toLocaleString('en')} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                {short(from < to ? from : to)} to {short(from < to ? to : from)}
                {inclusive ? ', including both dates' : ', not including the end date'}
              </p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Calendar days', total.toLocaleString('en')],
                    ['Weekend days', r.weekendDays.toLocaleString('en')],
                    ['Holidays excluded', r.holidays.toLocaleString('en')],
                    ['Working hours', `${(r.workDays * Math.max(0, s.hpd)).toLocaleString('en', { maximumFractionDigits: 2 })} h`],
                    ['Working weeks', (r.workDays / (7 - weekend.length)).toLocaleString('en', { maximumFractionDigits: 1 })],
                    ['Share of days worked', total ? `${Math.round((r.workDays / total) * 100)}%` : '—'],
                  ]}
                />
              </div>
              {holidaysInRange.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-semibold">Holidays in this range</p>
                  <ul className="flex flex-wrap gap-2">
                    {holidaysInRange.sort().map((h) => {
                      const onWeekend = weekend.includes(new Date(`${h}T00:00:00Z`).getUTCDay());
                      return (
                        <li key={h} className={`rounded-lg border px-2.5 py-1 text-xs ${onWeekend ? 'border-line text-muted line-through' : 'border-brand/40 bg-brand-soft/60'}`}>
                          {short(h)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <p className="mt-4 text-xs text-muted">Weekend: {weekend.map((d) => WEEKDAYS[d]).join(' and ')}. Add your country’s public holidays above for an exact count.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
