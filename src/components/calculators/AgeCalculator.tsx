import { daysBetween, isIsoDate, nextBirthday, span, weekday, WEEKDAYS } from '@/lib/calculators/dates';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { useToday } from '@/lib/hooks/useToday';
import { DateField } from './shared/body';
import { ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { dob: '1990-05-15', at: '' };

const longDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const plural = (n: number, word: string) => `${formatNumber(n, 0)} ${word}${n === 1 ? '' : 's'}`;
/** 1st, 2nd, 3rd, 4th … 11th, 12th, 13th … 21st. */
const ordinal = (n: number) => {
  const rem100 = n % 100;
  const suffix = rem100 >= 11 && rem100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};

export default function AgeCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const today = useToday();
  const dob = isIsoDate(s.dob) ? s.dob : DEFAULTS.dob;
  const at = isIsoDate(s.at) ? s.at : today;

  const age = at ? span(dob, at) : null;
  const totalDays = at ? daysBetween(dob, at) : 0;
  const next = at ? nextBirthday(dob, at) : null;
  const leapDay = dob.endsWith('-02-29');

  return (
    <section aria-label="Age calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <DateField label="Date of birth" value={dob} onChange={(v) => set('dob', v)} />
          <DateField label="Age on" value={at ?? ''} onChange={(v) => set('at', v)} hint={isIsoDate(s.at) ? undefined : 'Today. Pick another date to see your age on that day.'} />
          <div className="flex justify-end gap-2 border-t border-line pt-5">
            {isIsoDate(s.at) && (
              <button type="button" onClick={() => set('at', '')} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
                Use today
              </button>
            )}
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>

        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!age ? (
            <p className="text-sm text-muted">Working out today’s date…</p>
          ) : age.negative ? (
            <p className="font-medium text-warn">The date of birth is after the “age on” date. Check the two dates.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">Age</p>
                  <p className="tabular mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{plural(age.years, 'year')}</p>
                  <p className="tabular mt-1 text-lg font-medium">
                    {plural(age.months, 'month')}, {plural(age.days, 'day')}
                  </p>
                </div>
                <ShareButton />
              </div>

              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Total months', formatNumber(age.years * 12 + age.months, 0)],
                    ['Total weeks', `${plural(Math.floor(totalDays / 7), 'week')}, ${plural(totalDays % 7, 'day')}`],
                    ['Total days', formatNumber(totalDays, 0)],
                    ['Total hours (approx.)', formatNumber(totalDays * 24, 0)],
                  ]}
                />
              </div>

              {next && (
                <div className="mt-5 rounded-xl border border-line bg-surface p-4">
                  <p className="text-xs text-muted">Next birthday</p>
                  <p className="mt-1 font-semibold">
                    {next.daysAway === 0 ? '🎂 Today! ' : ''}
                    {WEEKDAYS[weekday(next.date)]}, {longDate(next.date)}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {next.daysAway === 0 ? `Happy ${ordinal(next.age)} birthday!` : `Turning ${next.age} in ${plural(next.daysAway, 'day')}`}
                    {leapDay && next.date.slice(5) !== '02-29' ? ' (29 February falls on 28 February this year)' : ''}
                  </p>
                </div>
              )}

              <p className="mt-4 text-sm text-muted">Born on a {WEEKDAYS[weekday(dob)]}.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
