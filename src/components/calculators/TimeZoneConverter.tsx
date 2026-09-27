import { useEffect, useId, useState } from 'react';
import { cityName, isValidZone, offsetLabel, utcToZoned, ZONES, zonedToUtc, zoneOffset } from '@/lib/calculators/timezones';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { useToday } from '@/lib/hooks/useToday';
import { SelectField, Tabs } from '@/components/ui/fields';
import { DateField } from './shared/body';
import { ShareButton } from './shared/results';

const DEFAULTS = { date: '', time: '09:00', from: '', to: 'Europe/London,Asia/Dubai,Asia/Kolkata,Asia/Tokyo,Australia/Sydney', h24: 'no' };

const clock12 = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const day = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

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

export default function TimeZoneConverter() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const today = useToday();
  // The visitor's own zone is only known in the browser.
  const [local, setLocal] = useState<string | null>(null);
  useEffect(() => setLocal(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'), []);

  const from = s.from && isValidZone(s.from) ? s.from : (local ?? 'UTC');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? s.date : today;
  const time = /^\d{2}:\d{2}$/.test(s.time) ? s.time : '09:00';
  const targets = s.to.split(',').filter((z) => z && isValidZone(z));
  const h24 = s.h24 === 'yes';
  const show = (hm: string) => (h24 ? hm : clock12(hm));

  const zoneOptions = [...new Set([...(local ? [local] : []), ...ZONES, from])].map((z) => ({ value: z, label: `${cityName(z)}${z === local ? ' (your time zone)' : ''}` }));
  const t = date ? zonedToUtc(date, time, from) : null;
  const fromOffset = t !== null ? zoneOffset(from, t) : 0;

  const setTargets = (list: string[]) => set('to', list.join(','));
  const addable = zoneOptions.filter((o) => !targets.includes(o.value) && o.value !== from);

  return (
    <section aria-label="Time zone converter" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <SelectField label="From time zone" value={from} onChange={(v) => set('from', v)} options={zoneOptions} />
          <div className="grid grid-cols-2 items-start gap-3">
            <DateField label="Date" value={date ?? ''} onChange={(v) => set('date', v)} />
            <TimeField label="Time" value={time} onChange={(v) => set('time', v)} />
          </div>
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
          {addable.length > 0 && targets.length < 12 && (
            <SelectField
              label="Add a time zone"
              value=""
              onChange={(v) => v && setTargets([...targets, v])}
              options={[{ value: '', label: 'Choose a city…' }, ...addable]}
            />
          )}
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {t === null || !date ? (
            <p className="text-sm text-muted">Loading your time zone…</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">
                    {cityName(from)} (UTC {offsetLabel(fromOffset)})
                  </p>
                  <p className="tabular mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{show(time)}</p>
                  <p className="mt-1 text-sm text-muted">{day(date)}</p>
                </div>
                <ShareButton />
              </div>
              <ul className="mt-6 space-y-2.5">
                {targets.map((z) => {
                  const w = utcToZoned(t, z);
                  const off = zoneOffset(z, t);
                  const diff = off - fromOffset;
                  const dayShift = Math.round((Date.parse(w.date) - Date.parse(date)) / 86_400_000);
                  const [hh] = w.time.split(':').map(Number);
                  const working = hh >= 9 && hh < 17;
                  return (
                    <li key={z} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{cityName(z)}</p>
                        <p className="text-xs text-muted">
                          UTC {offsetLabel(off)} · {diff === 0 ? 'same time' : `${offsetLabel(diff)} h`}
                          {working ? ' · working hours' : hh < 7 || hh >= 22 ? ' · night' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="tabular text-xl font-bold">{show(w.time)}</p>
                        <p className={`text-xs ${dayShift ? 'font-semibold text-brand' : 'text-muted'}`}>
                          {day(w.date)}
                          {dayShift > 0 ? ' (next day)' : dayShift < 0 ? ' (previous day)' : ''}
                        </p>
                      </div>
                      <button type="button" aria-label={`Remove ${cityName(z)}`} onClick={() => setTargets(targets.filter((x) => x !== z))} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
              {targets.length === 0 && <p className="mt-6 text-sm text-muted">Add a time zone to compare.</p>}
              <p className="mt-4 text-xs text-muted">Daylight saving time is applied automatically for the date you pick.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
