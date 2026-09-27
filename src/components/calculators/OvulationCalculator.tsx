import { addDays, daysBetween, isIsoDate, type IsoDate } from '@/lib/calculators/dates';
import { cycles } from '@/lib/calculators/fitness';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { useToday } from '@/lib/hooks/useToday';
import { NumberField } from '@/components/ui/fields';
import { DateField, HealthNote } from './shared/body';
import { ShareButton } from './shared/results';

const DEFAULTS = { date: '', cycle: 28, period: 5, luteal: 14 };

const fmt = (d: IsoDate, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en', { ...o, timeZone: 'UTC' });
const long = (d: IsoDate) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long' });

type Mark = 'period' | 'fertile' | 'ovulation' | null;

function Month({ first, markOf, today }: { first: IsoDate; markOf: (d: IsoDate) => Mark; today: IsoDate | null }) {
  const [y, m] = first.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const cls: Record<Exclude<Mark, null>, string> = {
    period: 'bg-rose-500/80 text-white',
    fertile: 'bg-emerald-500/25 text-fg',
    ovulation: 'bg-emerald-600 text-white font-bold',
  };
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{fmt(first, { month: 'long', year: 'numeric' })}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="py-1 text-muted">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = `${first.slice(0, 8)}${String(i + 1).padStart(2, '0')}`;
          const mark = markOf(d);
          return (
            <span key={d} className={`tabular flex aspect-square items-center justify-center rounded-lg ${mark ? cls[mark] : ''} ${d === today ? 'ring-2 ring-brand' : ''}`}>
              {i + 1}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function OvulationCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const today = useToday();
  const cycleLen = Math.min(45, Math.max(20, Math.round(s.cycle) || 28));
  const luteal = Math.min(17, Math.max(9, Math.round(s.luteal) || 14));
  const periodLen = Math.min(10, Math.max(1, Math.round(s.period) || 5));
  // Until a date is chosen, show an example cycle that started 10 days ago.
  const last = isIsoDate(s.date) ? s.date : today ? addDays(today, -10) : null;
  const list = last ? cycles(last, cycleLen, luteal, 6) : [];
  // The next fertile window that hasn't ended yet.
  const next = list.find((c) => !today || c.fertileEnd >= today) ?? list[0];

  const markOf = (d: IsoDate): Mark => {
    for (const c of list) {
      if (d === c.ovulation) return 'ovulation';
      if (d >= c.fertileStart && d <= c.fertileEnd) return 'fertile';
      if (d >= c.periodStart && daysBetween(c.periodStart, d) < periodLen) return 'period';
    }
    return null;
  };
  const monthOf = (d: IsoDate) => `${d.slice(0, 8)}01`;
  const firstMonth = next ? monthOf(next.fertileStart) : null;
  const secondMonth = firstMonth ? monthOf(addDays(firstMonth, 40)) : null;

  return (
    <section aria-label="Ovulation calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <DateField label="First day of your last period" value={last ?? ''} onChange={(v) => set('date', v)} hint={isIsoDate(s.date) ? undefined : 'Showing an example. Pick your date to see your own fertile days.'} />
          <NumberField label="Average cycle length" value={s.cycle} onChange={(v) => set('cycle', v)} suffix="days" min={20} max={45} decimals={0} hint="From the first day of one period to the day before the next. 28 is typical." />
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="Period length" value={s.period} onChange={(v) => set('period', v)} suffix="days" min={1} max={10} decimals={0} />
            <NumberField label="Luteal phase" value={s.luteal} onChange={(v) => set('luteal', v)} suffix="days" min={9} max={17} decimals={0} hint="Usually 14" />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!next ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">Estimated ovulation</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{long(next.ovulation)}</p>
                  <p className="mt-2 text-sm">
                    Most fertile: <strong>{fmt(next.fertileStart)} – {fmt(next.fertileEnd)}</strong>
                  </p>
                </div>
                <ShareButton />
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {firstMonth && <Month first={firstMonth} markOf={markOf} today={today} />}
                {secondMonth && <Month first={secondMonth} markOf={markOf} today={today} />}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                <span><span className="mr-1.5 inline-block size-3 rounded bg-rose-500/80 align-middle" />Period</span>
                <span><span className="mr-1.5 inline-block size-3 rounded bg-emerald-500/25 align-middle" />Fertile window</span>
                <span><span className="mr-1.5 inline-block size-3 rounded bg-emerald-600 align-middle" />Ovulation</span>
                <span><span className="mr-1.5 inline-block size-3 rounded ring-2 ring-brand align-middle" />Today</span>
              </div>
              <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Period starts</th>
                      <th className="px-4 py-2.5 font-medium">Fertile window</th>
                      <th className="px-4 py-2.5 text-right font-medium">Ovulation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {list.map((c) => (
                      <tr key={c.periodStart} className={c === next ? 'bg-brand-soft/60 font-medium' : ''}>
                        <td className="px-4 py-2.5">{fmt(c.periodStart, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-2.5">
                          {fmt(c.fertileStart)} – {fmt(c.fertileEnd)}
                        </td>
                        <td className="px-4 py-2.5 text-right">{fmt(c.ovulation)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">If you conceive, a pregnancy test is most reliable from {long(next.nextPeriod)}, the day your next period is due.</p>
            </>
          )}
        </div>
      </div>
      <HealthNote>Predictions assume regular cycles. Don’t use this for contraception; ovulation can shift from cycle to cycle.</HealthNote>
    </section>
  );
}
