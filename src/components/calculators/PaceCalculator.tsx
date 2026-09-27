import { useId } from 'react';
import { formatDuration, KM_PER_MILE, parseDuration, RACES, riegel } from '@/lib/calculators/fitness';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { solve: 'pace', d: 10, unit: 'km', t: '50:00', p: '5:00' };

function DurationField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint: string }) {
  const id = useId();
  const invalid = value.trim() !== '' && Number.isNaN(parseDuration(value));
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        aria-invalid={invalid}
        onChange={(e) => onChange(e.target.value)}
        className={`tabular h-12 w-full rounded-xl border bg-surface px-3.5 text-base font-medium outline-none focus:ring-4 ${invalid ? 'border-warn focus:ring-warn/15' : 'border-line focus:border-brand focus:ring-brand/15'}`}
      />
      <p className="mt-1.5 text-xs text-muted">{hint}</p>
    </div>
  );
}

export default function PaceCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const solve = s.solve === 'time' || s.solve === 'distance' ? s.solve : 'pace';
  const mi = s.unit === 'mi';
  const u = mi ? 'mi' : 'km';
  const kmPerUnit = mi ? KM_PER_MILE : 1;

  // Everything is worked out in km and seconds.
  const timeIn = parseDuration(s.t);
  const paceIn = parseDuration(s.p) / kmPerUnit; // seconds per km
  let km = s.d * kmPerUnit;
  let time = timeIn;
  let pace = paceIn;
  if (solve === 'pace') pace = time / km;
  if (solve === 'time') time = pace * km;
  if (solve === 'distance') km = time / pace;
  const valid = [km, time, pace].every((v) => Number.isFinite(v) && v > 0);

  const perKm = pace;
  const perMi = pace * KM_PER_MILE;
  const kmh = 3600 / pace;
  const splitUnit = mi ? KM_PER_MILE : 1;
  const splitCount = Math.min(50, Math.ceil(km / splitUnit - 1e-9));

  const headline = solve === 'pace' ? `${formatDuration(mi ? perMi : perKm)} /${u}` : solve === 'time' ? formatDuration(time) : `${formatNumber(km / kmPerUnit, 2)} ${u}`;

  return (
    <section aria-label="Running pace calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">Calculate</p>
            <Tabs
              value={solve}
              onChange={(v) => set('solve', v)}
              tabs={[
                { value: 'pace', label: 'Pace' },
                { value: 'time', label: 'Finish time' },
                { value: 'distance', label: 'Distance' },
              ]}
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Units</p>
            <Tabs
              value={u}
              onChange={(v) => {
                if (v === u) return;
                // Keep the same real distance and pace when switching.
                const factor = v === 'mi' ? 1 / KM_PER_MILE : KM_PER_MILE;
                set('d', Math.round(s.d * factor * 1000) / 1000);
                if (Number.isFinite(parseDuration(s.p))) set('p', formatDuration(parseDuration(s.p) / factor));
                set('unit', v);
              }}
              tabs={[
                { value: 'km', label: 'Kilometres' },
                { value: 'mi', label: 'Miles' },
              ]}
            />
          </div>
          {solve !== 'distance' && (
            <div>
              <NumberField label="Distance" value={s.d} onChange={(v) => set('d', v)} suffix={u} min={0} decimals={3} />
              <div className="mt-2 flex flex-wrap gap-2">
                {RACES.map((r) => (
                  <button key={r.id} type="button" onClick={() => set('d', Math.round((r.km / kmPerUnit) * 1000) / 1000)} className="h-8 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium hover:border-brand">
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {solve !== 'time' && <DurationField label="Time" value={s.t} onChange={(v) => set('t', v)} hint="h:mm:ss or mm:ss, e.g. 1:45:00 or 25:30" />}
          {solve !== 'pace' && <DurationField label={`Pace per ${u}`} value={s.p} onChange={(v) => set('p', v)} hint="mm:ss, e.g. 5:30" />}
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-muted">Enter a distance and a time or pace, such as 50:00 or 5:30.</p>
          ) : (
            <>
              <Headline label={solve === 'pace' ? 'Your pace' : solve === 'time' ? 'Finish time' : 'Distance covered'} value={headline} action={<ShareButton />} compact />
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Pace per km', `${formatDuration(perKm)} /km`],
                    ['Pace per mile', `${formatDuration(perMi)} /mi`],
                    ['Speed', `${formatNumber(kmh, 2)} km/h · ${formatNumber(kmh / KM_PER_MILE, 2)} mph`],
                    ['Distance · time', `${formatNumber(km / kmPerUnit, 2)} ${u} · ${formatDuration(time)}`],
                  ]}
                />
              </div>

              <p className="mt-6 mb-2 text-sm font-semibold">Predicted race times at this effort</p>
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Race</th>
                      <th className="px-4 py-2.5 text-right font-medium">Time</th>
                      <th className="px-4 py-2.5 text-right font-medium">Pace /{u}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {RACES.map((r) => {
                      const t = riegel(time, km, r.km);
                      return (
                        <tr key={r.id}>
                          <td className="px-4 py-2.5">{r.label}</td>
                          <td className="px-4 py-2.5 text-right font-medium">{formatDuration(t)}</td>
                          <td className="px-4 py-2.5 text-right">{formatDuration((t / r.km) * kmPerUnit)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted">Uses Riegel’s formula; predictions are most reliable between similar distances and assume matching training.</p>

              {splitCount > 1 && (
                <details className="mt-6 rounded-xl border border-line bg-surface">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Even-pace splits ({splitCount} {u})</summary>
                  <div className="max-h-72 overflow-y-auto border-t border-line">
                    <table className="tabular w-full text-sm">
                      <tbody className="divide-y divide-line">
                        {Array.from({ length: splitCount }, (_, i) => {
                          const at = Math.min(km, (i + 1) * splitUnit);
                          return (
                            <tr key={i}>
                              <td className="px-4 py-2">
                                {formatNumber(at / kmPerUnit, at / kmPerUnit === Math.round(at / kmPerUnit) ? 0 : 2)} {u}
                              </td>
                              <td className="px-4 py-2 text-right">{formatDuration(at * pace)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
