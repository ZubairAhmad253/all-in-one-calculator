import { useEffect, useId, useState } from 'react';
import { countWorkDays, isIsoDate, type IsoDate } from '@/lib/calculators/dates';
import { localToday } from '@/lib/hooks/useToday';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { DateField } from './shared/body';
import { ShareButton } from './shared/results';

const DEFAULTS = { name: '', date: '', time: '00:00' };

/** Fixed-date events; each resolves to its next occurrence. */
const PRESETS = [
  { name: 'New Year', md: '01-01' },
  { name: 'Valentine’s Day', md: '02-14' },
  { name: 'Halloween', md: '10-31' },
  { name: 'Christmas', md: '12-25' },
  { name: 'New Year’s Eve', md: '12-31' },
];

const nextOccurrence = (md: string, today: IsoDate) => {
  const y = Number(today.slice(0, 4));
  return `${y}-${md}` > today ? `${y}-${md}` : `${y + 1}-${md}`;
};

/** Local time (ms) for a date and "HH:MM" in the visitor's zone. */
const localMs = (date: IsoDate, time: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h || 0, min || 0).getTime();
};

const long = (d: IsoDate) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function CountdownCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const [now, setNow] = useState<number | null>(null);
  const nameId = useId();
  const timeId = useId();
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = now ? localToday() : null;
  const target = isIsoDate(s.date) ? s.date : today ? nextOccurrence('12-25', today) : null;
  const name = s.name.trim() || (isIsoDate(s.date) ? 'your event' : 'Christmas');
  const time = /^\d{2}:\d{2}$/.test(s.time) ? s.time : '00:00';
  const ms = target && now ? localMs(target, time) - now : 0;
  const past = ms < 0;
  const abs = Math.abs(ms);
  const parts = {
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor((abs % 86_400_000) / 3_600_000),
    minutes: Math.floor((abs % 3_600_000) / 60_000),
    seconds: Math.floor((abs % 60_000) / 1000),
  };
  const work = target && today && !past ? countWorkDays(today, target, undefined, false).workDays : 0;

  return (
    <section aria-label="Countdown calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium">
              Event name (optional)
            </label>
            <input
              id={nameId}
              type="text"
              maxLength={60}
              value={s.name}
              placeholder="e.g. Wedding, holiday, exam"
              onChange={(e) => set('name', e.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-base font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            <DateField label="Event date" value={target ?? ''} onChange={(v) => set('date', v)} />
            <div>
              <label htmlFor={timeId} className="mb-1.5 block text-sm font-medium">
                Time
              </label>
              <input
                id={timeId}
                type="time"
                value={time}
                onChange={(e) => e.target.value && set('time', e.target.value)}
                className="tabular h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-base font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Quick picks</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  disabled={!today}
                  onClick={() => {
                    if (!today) return;
                    set('name', p.name);
                    set('date', nextOccurrence(p.md, today));
                    set('time', '00:00');
                  }}
                  className="h-9 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:border-brand"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="off">
          {!target || !now ? (
            <p className="text-sm text-muted">Starting the countdown…</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">{past ? `Time since ${name}` : `Countdown to ${name}`}</p>
                  <p className="mt-1 text-lg font-semibold">
                    {long(target)}
                    {time !== '00:00' && `, ${time}`}
                  </p>
                </div>
                <ShareButton />
              </div>
              <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3">
                {(Object.entries(parts) as [string, number][]).map(([k, v]) => (
                  <div key={k} className="rounded-2xl border border-line bg-surface px-2 py-4 text-center">
                    <p className="tabular text-3xl font-bold tracking-tight sm:text-5xl">{k === 'days' ? v.toLocaleString('en') : String(v).padStart(2, '0')}</p>
                    <p className="mt-1 text-xs text-muted capitalize">{k}</p>
                  </div>
                ))}
              </div>
              {past && <p className="mt-3 text-sm text-warn">This date has passed. Pick a future date to count down to it.</p>}
              <dl className="mt-6 grid grid-cols-2 gap-3">
                {[
                  ['Total days', (abs / 86_400_000).toLocaleString('en', { maximumFractionDigits: 1 })],
                  ['Weeks', (abs / 604_800_000).toLocaleString('en', { maximumFractionDigits: 1 })],
                  ['Total hours', Math.floor(abs / 3_600_000).toLocaleString('en')],
                  ['Weekdays left (Mon–Fri)', past ? '—' : work.toLocaleString('en')],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-line bg-surface p-3.5">
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="tabular mt-1 font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-muted">Counts down in your own time zone. Share the link to send this countdown to someone else.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
