import { ACTIVITY_LEVELS, bmr, bmrHarrisBenedict, bmrKatchMcArdle, type Sex } from '@/lib/calculators/health';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField } from '@/components/ui/fields';
import { BODY_DEFAULTS, BodyFields, HealthNote, readBody, SexAgeFields } from './shared/body';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { ...BODY_DEFAULTS, sex: 'male', age: 30, bf: 0 };

const kcal = (v: number) => `${formatNumber(Math.round(v), 0)} kcal`;

export default function BmrCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const { cm, kg } = readBody(s);
  const sex: Sex = s.sex === 'female' ? 'female' : 'male';
  const valid = kg > 0 && cm > 0 && s.age >= 15 && s.age <= 100;
  const hasBf = s.bf > 0 && s.bf < 70;

  const mifflin = bmr(sex, kg, cm, s.age);
  const harris = bmrHarrisBenedict(sex, kg, cm, s.age);
  const katch = hasBf ? bmrKatchMcArdle(kg, s.bf) : Number.NaN;

  return (
    <section aria-label="BMR calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <SexAgeFields sex={s.sex} age={s.age} onSex={(v) => set('sex', v)} onAge={(v) => set('age', v)} />
          <BodyFields s={s} set={set} />
          <NumberField label="Body fat (optional)" value={s.bf} onChange={(v) => set('bf', v)} suffix="%" min={0} max={70} decimals={1} hint="Adds the Katch–McArdle equation, which uses lean mass. Leave at 0 if you don’t know it." />
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-muted">Enter an age between 15 and 100, your height and your weight.</p>
          ) : (
            <>
              <Headline label="Basal metabolic rate (Mifflin–St Jeor)" value={formatNumber(Math.round(mifflin), 0)} action={<ShareButton />} />
              <p className="mt-1 text-sm text-muted">kcal per day at complete rest, about {formatNumber(Math.round(mifflin / 24), 0)} kcal an hour</p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Mifflin–St Jeor (1990)', kcal(mifflin)],
                    ['Harris–Benedict (revised)', kcal(harris)],
                    ['Katch–McArdle', hasBf ? kcal(katch) : 'Add body fat %'],
                    ['Lean body mass', hasBf ? `${formatNumber(kg * (1 - s.bf / 100), 1)} kg` : '—'],
                  ]}
                />
              </div>
              <p className="mt-6 mb-2 text-sm font-semibold">Daily calories by activity level</p>
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Activity</th>
                      <th className="px-4 py-2.5 text-right font-medium">Factor</th>
                      <th className="px-4 py-2.5 text-right font-medium">Calories / day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {ACTIVITY_LEVELS.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-2.5">
                          {a.label}
                          <span className="block text-xs text-muted">{a.detail}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">× {a.factor}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{kcal(mifflin * a.factor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      <HealthNote>BMR is the energy your body uses for breathing, circulation and other basic functions. Equations are accurate to about ±10% for most people.</HealthNote>
    </section>
  );
}
