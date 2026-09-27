import { addDays, daysBetween, isIsoDate, span, weekday, WEEKDAYS, workingDays } from '@/lib/calculators/dates';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { useToday } from '@/lib/hooks/useToday';
import { DateField } from './shared/body';
import { ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { from: '', to: '', incl: 0 };

const plural = (n: number, word: string) => `${formatNumber(n, 0)} ${word}${n === 1 ? '' : 's'}`;
const longDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function DateDifferenceCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const today = useToday();
  // Until dates are picked: from today to 31 December of this year.
  const from = isIsoDate(s.from) ? s.from : today;
  const to = isIsoDate(s.to) ? s.to : today ? `${today.slice(0, 4)}-12-31` : null;
  const inclusive = s.incl === 1;

  if (!from || !to) {
    return <section aria-label="Date difference calculator" className="card p-7 text-sm text-muted">Working out today’s date…</section>;
  }

  // Including the end date adds one day to the span.
  const end = inclusive ? addDays(to, daysBetween(from, to) < 0 ? -1 : 1) : to;
  const d = span(from, end);
  const total = Math.abs(daysBetween(from, end));
  const work = workingDays(from, to, inclusive);

  return (
    <section aria-label="Date difference calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <DateField label="Start date" value={from} onChange={(v) => set('from', v)} />
          <DateField label="End date" value={to} onChange={(v) => set('to', v)} />
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={inclusive} onChange={(e) => set('incl', e.target.checked ? 1 : 0)} className="size-4 accent-[var(--brand)]" />
            Include the end date (add 1 day)
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <button
              type="button"
              onClick={() => {
                set('from', to);
                set('to', from);
              }}
              className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg"
            >
              Swap dates
            </button>
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>

        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">
                {longDate(from)} → {longDate(to)}
              </p>
              <p className="tabular mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{plural(total, 'day')}</p>
              <p className="tabular mt-1 text-lg font-medium">
                {[d.years && plural(d.years, 'year'), d.months && plural(d.months, 'month'), plural(d.days, 'day')].filter(Boolean).join(', ')}
                {d.negative ? ' (end date is before start date)' : ''}
              </p>
            </div>
            <ShareButton />
          </div>

          <div className="mt-6">
            <StatGrid
              items={[
                ['Weeks', `${plural(Math.floor(total / 7), 'week')}, ${plural(total % 7, 'day')}`],
                ['Working days (Mon–Fri)', formatNumber(work, 0)],
                ['Weekend days', formatNumber(total - work, 0)],
                ['Hours', formatNumber(total * 24, 0)],
              ]}
            />
          </div>
          <p className="mt-4 text-sm text-muted">
            Starts on a {WEEKDAYS[weekday(from)]} and ends on a {WEEKDAYS[weekday(to)]}. Working days don’t allow for public holidays.
          </p>
        </div>
      </div>
    </section>
  );
}
