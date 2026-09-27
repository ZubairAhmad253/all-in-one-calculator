import { useEffect, useState } from 'react';
import { addDays, dueDate, gestationalAge, isIsoDate, milestoneDates, trimester, type DueDateMethod, type IsoDate } from '@/lib/calculators/health';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { DateField } from './shared/body';
import { ShareButton } from './shared/results';

const DEFAULTS = { m: 'lmp', date: '', cycle: 28, embryo: 5 };

const METHODS: { value: 'lmp' | 'conception' | 'ivf'; label: string }[] = [
  { value: 'lmp', label: 'Last period' },
  { value: 'conception', label: 'Conception' },
  { value: 'ivf', label: 'IVF transfer' },
];

/** Today's date in the visitor's own time zone. */
const localToday = (): IsoDate => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const longDate = (d: IsoDate) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortDate = (d: IsoDate) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function PregnancyDueDateCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  // "Today" is only known in the browser, so it is filled in after the page loads.
  const [today, setToday] = useState<IsoDate | null>(null);
  useEffect(() => setToday(localToday()), []);

  const methodTab = s.m === 'conception' || s.m === 'ivf' ? s.m : 'lmp';
  const method: DueDateMethod = methodTab === 'ivf' ? (s.embryo === 3 ? 'ivf3' : 'ivf5') : methodTab;
  // With no date chosen yet, show an example from about 10 weeks ago.
  const exampleOffset = methodTab === 'lmp' ? -70 : methodTab === 'conception' ? -56 : -51;
  const date = isIsoDate(s.date) ? s.date : today ? addDays(today, exampleOffset) : null;
  const cycle = Math.min(Math.max(Math.round(s.cycle) || 28, 20), 45);

  const due = date ? dueDate(method, date, cycle) : null;
  const age = due && today ? gestationalAge(due, today) : null;
  const tri = age ? trimester(age.totalDays) : null;
  const progress = age ? Math.min(Math.max(age.totalDays / 280, 0), 1) : 0;
  const milestones = due ? milestoneDates(due) : [];
  const daysToGo = due && today ? Math.round((Date.parse(due) - Date.parse(today)) / 86_400_000) : null;

  const dateLabel = { lmp: 'First day of your last period', conception: 'Conception date', ivf: 'Embryo transfer date' }[methodTab];

  return (
    <section aria-label="Pregnancy due date calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">Calculate from</p>
            <Tabs value={methodTab} onChange={(v) => set('m', v)} tabs={METHODS} />
          </div>

          <DateField label={dateLabel} value={date ?? ''} onChange={(v) => set('date', v)} max={today ?? undefined} hint={isIsoDate(s.date) ? undefined : 'Showing an example date. Pick yours to see your due date.'} />

          {methodTab === 'lmp' && (
            <NumberField
              label="Average cycle length"
              value={s.cycle}
              onChange={(v) => set('cycle', v)}
              suffix="days"
              min={20}
              max={45}
              decimals={0}
              slider={{ min: 21, max: 40, step: 1 }}
              hint="28 days is typical. Longer cycles usually mean a later due date."
            />
          )}

          {methodTab === 'ivf' && (
            <SelectField
              label="Embryo age at transfer"
              value={s.embryo === 3 ? 3 : 5}
              onChange={(v) => set('embryo', v)}
              options={[
                { value: 5, label: 'Day 5 (blastocyst)' },
                { value: 3, label: 'Day 3' },
              ]}
            />
          )}

          <div className="flex justify-end border-t border-line pt-5">
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>

        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Estimated due date</p>
              <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{due ? longDate(due) : '—'}</p>
            </div>
            <ShareButton />
          </div>

          {age && age.totalDays >= 0 && age.totalDays <= 42 * 7 ? (
            <>
              <div className="mt-6">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold">
                    {age.weeks} weeks{age.days ? `, ${age.days} day${age.days === 1 ? '' : 's'}` : ''} pregnant today
                  </span>
                  <span className="text-muted">{tri ? `Trimester ${tri}` : ''}</span>
                </div>
                <div
                  className="relative mt-2 h-3 overflow-hidden rounded-full bg-surface"
                  role="progressbar"
                  aria-label="Pregnancy progress"
                  aria-valuemin={0}
                  aria-valuemax={40}
                  aria-valuenow={Math.min(age.weeks, 40)}
                >
                  <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
                  {[13, 27].map((w) => (
                    <span key={w} className="absolute top-0 h-full w-0.5 bg-bg" style={{ left: `${((w * 7 + 7) / 280) * 100}%` }} aria-hidden="true" />
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>Week 0</span>
                  <span>{daysToGo !== null && daysToGo > 0 ? `${daysToGo} days to go` : daysToGo === 0 ? 'Due today' : 'Past due date'}</span>
                  <span>Week 40</span>
                </div>
              </div>

              <h2 className="mt-7 text-sm font-semibold">Key dates</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {milestones.map((m) => {
                  const passed = today !== null && m.date <= today;
                  return (
                    <li key={m.label} className="flex items-center gap-3">
                      <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] ${passed ? 'bg-accent text-bg' : 'border border-line bg-surface'}`} aria-hidden="true">
                        {passed ? '✓' : ''}
                      </span>
                      <span className={passed ? 'text-muted' : ''}>
                        {m.label} <span className="text-xs text-muted">(week {Math.floor(m.day / 7)})</span>
                      </span>
                      <span className="tabular ml-auto shrink-0 font-medium">{shortDate(m.date)}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            age && <p className="mt-6 text-sm text-muted">This date is outside a current pregnancy, so weeks pregnant aren’t shown.</p>
          )}
        </div>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-7">
        Only about 4% of babies arrive on their due date; most are born between 37 and 42 weeks. Your doctor or midwife may adjust the date after an early ultrasound. This is an
        estimate, not medical advice.
      </p>
    </section>
  );
}
