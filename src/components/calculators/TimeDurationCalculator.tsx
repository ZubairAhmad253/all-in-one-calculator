import { useId } from 'react';
import { daysBetween, isIsoDate, parseTime } from '@/lib/calculators/dates';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { useToday } from '@/lib/hooks/useToday';
import { NumberField, Tabs } from '@/components/ui/fields';
import { DateField } from './shared/body';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { mode: 'between', start: '09:15', end: '17:45', dates: 'no', d1: '', d2: '', op: 'add', h: 2, m: 30, s: 0 };

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="tabular h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-base font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
    </div>
  );
}

const hms = (sec: number) => {
  const t = Math.round(Math.abs(sec));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${h} h ${m} min${s ? ` ${s} s` : ''}`;
};
const clock = (min: number) => {
  const t = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  return `${h % 12 || 12}:${String(t % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

const clock24 = (min: number) => {
  const t = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

export default function TimeDurationCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const today = useToday();
  const mode = s.mode === 'add' ? 'add' : 'between';
  const withDates = s.dates === 'yes';
  const start = parseTime(s.start);
  const end = parseTime(s.end);

  // Between two times, in seconds.
  let seconds = Number.NaN;
  let overnight = false;
  if (!Number.isNaN(start) && !Number.isNaN(end)) {
    if (withDates) {
      const d1 = isIsoDate(s.d1) ? s.d1 : today;
      const d2 = isIsoDate(s.d2) ? s.d2 : today;
      if (d1 && d2) seconds = (daysBetween(d1, d2) * 1440 + end - start) * 60;
    } else {
      overnight = end < start;
      seconds = ((overnight ? end + 1440 : end) - start) * 60;
    }
  }

  // Adding or subtracting a duration from a time.
  const durationMin = Math.max(0, s.h) * 60 + Math.max(0, s.m) + Math.max(0, s.s) / 60;
  const sign = s.op === 'sub' ? -1 : 1;
  const resultMin = start + sign * durationMin;
  const dayShift = Math.floor(resultMin / 1440);

  return (
    <section aria-label="Time duration calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={mode}
            onChange={(v) => set('mode', v)}
            tabs={[
              { value: 'between', label: 'Between two times' },
              { value: 'add', label: 'Add or subtract time' },
            ]}
          />
          {mode === 'between' ? (
            <>
              {withDates && (
                <div className="grid grid-cols-2 items-start gap-3">
                  <DateField label="Start date" value={(isIsoDate(s.d1) ? s.d1 : today) ?? ''} onChange={(v) => set('d1', v)} />
                  <DateField label="End date" value={(isIsoDate(s.d2) ? s.d2 : today) ?? ''} onChange={(v) => set('d2', v)} />
                </div>
              )}
              <div className="grid grid-cols-2 items-start gap-3">
                <TimeField label="Start time" value={s.start} onChange={(v) => set('start', v)} />
                <TimeField label="End time" value={s.end} onChange={(v) => set('end', v)} />
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" checked={withDates} onChange={(e) => set('dates', e.target.checked ? 'yes' : 'no')} className="size-4 accent-[var(--brand)]" />
                Span more than one day (add dates)
              </label>
            </>
          ) : (
            <>
              <TimeField label="Start time" value={s.start} onChange={(v) => set('start', v)} />
              <Tabs
                value={sign < 0 ? 'sub' : 'add'}
                onChange={(v) => set('op', v)}
                tabs={[
                  { value: 'add', label: 'Add' },
                  { value: 'sub', label: 'Subtract' },
                ]}
              />
              <div className="grid grid-cols-3 items-start gap-3">
                <NumberField label="Hours" value={s.h} onChange={(v) => set('h', v)} min={0} max={100_000} decimals={0} />
                <NumberField label="Minutes" value={s.m} onChange={(v) => set('m', v)} min={0} max={100_000} decimals={0} />
                <NumberField label="Seconds" value={s.s} onChange={(v) => set('s', v)} min={0} max={100_000} decimals={0} />
              </div>
            </>
          )}
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {mode === 'between' ? (
            !Number.isFinite(seconds) ? (
              <p className="text-sm text-muted">Enter a start and end time.</p>
            ) : (
              <>
                <Headline label={seconds < 0 ? 'Duration (end is before start)' : 'Duration'} value={hms(seconds)} action={<ShareButton />} compact />
                {overnight && <p className="mt-2 text-sm text-muted">The end time is earlier than the start, so it’s counted as the next day.</p>}
                <div className="mt-6">
                  <StatGrid
                    items={[
                      ['Decimal hours', (Math.abs(seconds) / 3600).toLocaleString('en', { maximumFractionDigits: 4 })],
                      ['Total minutes', (Math.abs(seconds) / 60).toLocaleString('en', { maximumFractionDigits: 2 })],
                      ['Total seconds', Math.abs(seconds).toLocaleString('en')],
                      ['Days', (Math.abs(seconds) / 86_400).toLocaleString('en', { maximumFractionDigits: 4 })],
                    ]}
                  />
                </div>
              </>
            )
          ) : Number.isNaN(start) ? (
            <p className="text-sm text-muted">Enter a start time.</p>
          ) : (
            <>
              <Headline label={`${clock(start)} ${sign < 0 ? '−' : '+'} ${hms(durationMin * 60)} =`} value={clock(resultMin)} action={<ShareButton />} />
              {dayShift !== 0 && (
                <p className="mt-2 text-sm font-medium text-brand">
                  {Math.abs(dayShift) === 1 ? (dayShift > 0 ? 'The next day' : 'The previous day') : `${Math.abs(dayShift)} days ${dayShift > 0 ? 'later' : 'earlier'}`}
                </p>
              )}
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['24-hour clock', clock24(resultMin)],
                    ['Duration in decimal hours', (durationMin / 60).toLocaleString('en', { maximumFractionDigits: 4 })],
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
