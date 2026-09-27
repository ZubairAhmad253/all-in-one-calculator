import { useId } from 'react';
import { parseTime } from '@/lib/calculators/dates';
import { bedtimesFor, clock, wakeTimesFor } from '@/lib/calculators/fitness';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { mode: 'wake', wake: '07:00', bed: '23:00', fall: 15, h24: 'no' };

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="tabular h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-base font-medium outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
    </div>
  );
}

const hours = (min: number) => `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`;

export default function SleepCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'bed' ? 'bed' : 'wake';
  const h24 = s.h24 === 'yes';
  const fall = Math.min(60, Math.max(0, Math.round(s.fall)));
  const wake = parseTime(s.wake);
  const bed = parseTime(s.bed);
  const options = mode === 'wake' ? (Number.isNaN(wake) ? [] : bedtimesFor(wake, fall)) : Number.isNaN(bed) ? [] : wakeTimesFor(bed, fall);

  const five = options.find((o) => o.cycles === 5);

  const now = () => {
    const d = new Date();
    set('bed', `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    set('mode', 'bed');
  };

  return (
    <section aria-label="Sleep calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={mode}
            onChange={(v) => set('mode', v)}
            tabs={[
              { value: 'wake', label: 'I need to wake at' },
              { value: 'bed', label: 'I’m going to bed at' },
            ]}
          />
          {mode === 'wake' ? <TimeField label="Wake-up time" value={s.wake} onChange={(v) => set('wake', v)} /> : <TimeField label="Bedtime" value={s.bed} onChange={(v) => set('bed', v)} />}
          <button type="button" onClick={now} className="h-10 w-full rounded-xl border border-brand/40 bg-brand-soft px-4 text-sm font-semibold text-brand hover:border-brand">
            I’m going to bed now
          </button>
          <NumberField label="Time to fall asleep" value={s.fall} onChange={(v) => set('fall', v)} suffix="minutes" min={0} max={60} decimals={0} hint="Most people take 10–20 minutes." />
          <div>
            <p className="mb-1.5 text-sm font-medium">Clock</p>
            <Tabs
              value={h24 ? 'yes' : 'no'}
              onChange={(v) => set('h24', v)}
              tabs={[
                { value: 'no', label: '12-hour' },
                { value: 'yes', label: '24-hour' },
              ]}
            />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">{mode === 'wake' ? `To wake refreshed at ${clock(wake, h24)}, go to sleep at` : `Going to bed at ${clock(bed, h24)}, set an alarm for`}</p>
              {five && <p className="tabular mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{clock(five.time, h24)}</p>}
              <p className="mt-1 text-sm text-muted">5 full sleep cycles (7 h 30 min of sleep)</p>
            </div>
            <ShareButton />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {options.map((o) => {
              const best = o.cycles === 5 || o.cycles === 6;
              return (
                <div key={o.cycles} className={`rounded-xl border p-4 ${best ? 'border-brand bg-brand-soft/60' : 'border-line bg-surface'}`}>
                  <p className="tabular text-2xl font-bold">{clock(o.time, h24)}</p>
                  <p className="mt-1 text-sm">
                    {o.cycles} cycles · {hours(o.sleepMin)} of sleep
                  </p>
                  <p className={`mt-1 text-xs ${best ? 'font-semibold text-brand' : 'text-muted'}`}>{o.cycles === 6 ? 'Ideal for most adults' : o.cycles === 5 ? 'Recommended' : o.cycles === 4 ? 'Short night' : 'Nap-length; not enough regularly'}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted">
            A sleep cycle lasts about 90 minutes. Waking at the end of one, rather than in deep sleep, helps you feel less groggy. Times include {fall} minutes to fall asleep.
          </p>
        </div>
      </div>
    </section>
  );
}
