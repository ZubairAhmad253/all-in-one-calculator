import { useMemo } from 'react';
import { ACTIVITY_LEVELS, bmr, calorieGoals, LB_PER_KG, minimumCalories, tdee, type ActivityId, type Sex } from '@/lib/calculators/health';
import { formatNumber } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { BODY_DEFAULTS, BodyFields, readBody } from './shared/body';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { ...BODY_DEFAULTS, sex: 'male', age: 30, act: 'moderate' };

const kcal = (v: number) => `${formatNumber(Math.round(v), 0)} kcal`;

export default function CalorieCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const { metric, cm, kg } = readBody(s);
  const sex: Sex = s.sex === 'female' ? 'female' : 'male';
  const act = (ACTIVITY_LEVELS.some((a) => a.id === s.act) ? s.act : 'moderate') as ActivityId;
  const valid = kg > 0 && cm > 0 && s.age >= 15 && s.age <= 100;

  const base = bmr(sex, kg, cm, s.age);
  const maintenance = tdee(sex, kg, cm, s.age, act);

  // Weekly steps in the user's unit: 0.25 / 0.5 / 1 kg, or 0.5 / 1 / 2 lb.
  const goals = useMemo(() => {
    const steps = metric ? [0.25, 0.5, 1] : [0.5, 1, 2];
    const unit = metric ? 'kg' : 'lb';
    const toKg = (v: number) => (metric ? v : v / LB_PER_KG);
    const names = ['Mild', '', 'Fast'];
    return calorieGoals(maintenance, sex, [
      ...steps.map((v, i) => ({ label: `${names[i] ? names[i] + ' weight' : 'Weight'} loss · ${v} ${unit}/week`, kgPerWeek: -toKg(v) })),
      ...steps.map((v, i) => ({ label: `${names[i] ? names[i] + ' weight' : 'Weight'} gain · ${v} ${unit}/week`, kgPerWeek: toKg(v) })),
    ]);
  }, [maintenance, sex, metric]);

  return (
    <section aria-label="Calorie calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="grid grid-cols-2 items-end gap-3">
            <div>
              <p className="mb-1.5 text-sm font-medium">Sex</p>
              <Tabs
                value={sex}
                onChange={(v) => set('sex', v)}
                tabs={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
              />
            </div>
            <NumberField label="Age" value={s.age} onChange={(v) => set('age', v)} suffix="years" min={15} max={100} decimals={0} />
          </div>

          <BodyFields s={s} set={set} />

          <div>
            <SelectField
              label="Activity level"
              value={act}
              onChange={(v) => set('act', v)}
              options={ACTIVITY_LEVELS.map((a) => ({ value: a.id, label: `${a.label}: ${a.detail}` }))}
            />
          </div>

          <div className="flex justify-end border-t border-line pt-5">
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>

        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {valid ? (
            <>
              <Headline label="Calories to maintain your weight" value={`${formatNumber(Math.round(maintenance), 0)}`} action={<ShareButton />} />
              <p className="mt-1 text-sm text-muted">kcal per day</p>

              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Basal metabolic rate (BMR)', kcal(base)],
                    ['Activity factor', `× ${ACTIVITY_LEVELS.find((a) => a.id === act)!.factor}`],
                  ]}
                />
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Goal</th>
                      <th className="px-4 py-2.5 text-right font-medium">Calories / day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr className="font-semibold">
                      <td className="px-4 py-2.5">Maintain weight</td>
                      <td className="px-4 py-2.5 text-right">{kcal(maintenance)}</td>
                    </tr>
                    {goals.map((g) => (
                      <tr key={g.label} className={g.belowMinimum ? 'text-muted' : ''}>
                        <td className="px-4 py-2.5">
                          {g.label}
                          {g.belowMinimum && <span className="ml-2 text-xs font-medium text-warn">below recommended minimum</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {kcal(g.calories)} <span className="text-xs text-muted">({formatNumber((g.calories / maintenance) * 100, 0)}%)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {goals.some((g) => g.belowMinimum) && (
                <p className="mt-3 text-xs text-muted">
                  Eating under about {formatNumber(minimumCalories(sex), 0)} kcal a day isn’t generally recommended without medical supervision.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">Enter an age between 15 and 100, your height and your weight to see your daily calories.</p>
          )}
        </div>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-7">
        Estimates use the Mifflin–St Jeor equation. Individual needs vary. This isn’t medical advice; if you’re pregnant, breastfeeding, under 18 or managing a health condition,
        ask a doctor or dietitian.
      </p>
    </section>
  );
}
