import { addDays, addMonths, addWorkDays, daysBetween, isIsoDate, weekday, WEEKDAYS, type IsoDate } from '@/lib/calculators/dates';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { useToday } from '@/lib/hooks/useToday';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { DateField } from './shared/body';
import { ShareButton } from './shared/results';

const DEFAULTS = { date: '', op: 'add', n: 30, unit: 'd' };

const UNITS = [
  { value: 'd', label: 'Days' },
  { value: 'bd', label: 'Business days (Mon–Fri)' },
  { value: 'w', label: 'Weeks' },
  { value: 'm', label: 'Months' },
  { value: 'y', label: 'Years' },
];

const long = (d: IsoDate) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const short = (d: IsoDate) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function shift(date: IsoDate, n: number, unit: string): IsoDate {
  if (unit === 'bd') return addWorkDays(date, n);
  if (unit === 'w') return addDays(date, n * 7);
  if (unit === 'm') return addMonths(date, n);
  if (unit === 'y') return addMonths(date, n * 12);
  return addDays(date, n);
}

export default function AddDaysCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const today = useToday();
  const start = isIsoDate(s.date) ? s.date : today;
  const sign = s.op === 'sub' ? -1 : 1;
  const n = Math.min(100_000, Math.max(0, Math.round(s.n)));
  const unit = UNITS.some((u) => u.value === s.unit) ? s.unit : 'd';
  const unitLabel = UNITS.find((u) => u.value === unit)!.label.toLowerCase().replace(' (mon–fri)', '');
  const result = start ? shift(start, sign * n, unit) : null;
  const days = start && result ? daysBetween(start, result) : 0;
  const year = result ? Number(result.slice(0, 4)) : 0;
  const dayOfYear = result ? daysBetween(`${year}-01-01`, result) + 1 : 0;

  return (
    <section aria-label="Add or subtract days calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <DateField label="Start date" value={start ?? ''} onChange={(v) => set('date', v)} hint={isIsoDate(s.date) ? undefined : 'Starts from today.'} />
          <Tabs
            value={sign < 0 ? 'sub' : 'add'}
            onChange={(v) => set('op', v)}
            tabs={[
              { value: 'add', label: 'Add' },
              { value: 'sub', label: 'Subtract' },
            ]}
          />
          <div className="grid grid-cols-2 items-end gap-3">
            <NumberField label="Amount" value={s.n} onChange={(v) => set('n', v)} min={0} max={100_000} decimals={0} />
            <SelectField label="Unit" value={unit} onChange={(v) => set('unit', v)} options={UNITS} />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!start || !result ? (
            <p className="text-sm text-muted">Loading today’s date…</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">
                    {short(start)} {sign < 0 ? '−' : '+'} {n.toLocaleString('en')} {n === 1 ? unitLabel.replace(/s$/, '') : unitLabel} =
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{long(result)}</p>
                </div>
                <ShareButton />
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ['Calendar days', `${days < 0 ? '−' : ''}${Math.abs(days).toLocaleString('en')}`],
                  ['Weeks', `${(Math.abs(days) / 7).toLocaleString('en', { maximumFractionDigits: 1 })}`],
                  ['Day of the year', `${dayOfYear} of ${year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365}`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-line bg-surface p-3.5">
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="tabular mt-1 font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 mb-2 text-sm font-semibold">
                Common offsets from {short(start)}
              </p>
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <tbody className="divide-y divide-line">
                    {[7, 14, 30, 60, 90, 180, 365].map((d) => (
                      <tr key={d}>
                        <td className="px-4 py-2 text-muted">{d} days before</td>
                        <td className="px-4 py-2">{short(addDays(start, -d))}</td>
                        <td className="px-4 py-2 text-muted">{d} days after</td>
                        <td className="px-4 py-2 text-right font-medium">{short(addDays(start, d))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">
                {unit === 'm' || unit === 'y' ? 'Adding months keeps the day of the month, moving to the last day if the month is shorter (31 Jan + 1 month = 28 or 29 Feb). ' : ''}
                {unit === 'bd' ? 'Business days skip Saturdays and Sundays; public holidays aren’t excluded. ' : ''}
                The start date itself isn’t counted.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
