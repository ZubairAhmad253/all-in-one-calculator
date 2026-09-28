import { M2_PER_FT2, M_PER_FT, pitchDegrees, pitchFactor, roof } from '@/lib/calculators/build';
import { CURRENCY_CODES, currencySymbol, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { u: 'imperial', l: 12, w: 9, o: 0.5, lft: 40, wft: 30, oft: 1, pitch: 6, waste: 10, price: 0, cur: 'USD' };
const PITCHES = [3, 4, 5, 6, 7, 8, 9, 10, 12];

export default function RoofingCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const metric = s.u === 'metric';
  const L = metric ? s.l : s.lft * M_PER_FT;
  const W = metric ? s.w : s.wft * M_PER_FT;
  const O = metric ? s.o : s.oft * M_PER_FT;
  const pitch = Math.min(24, Math.max(0, s.pitch));
  const r = roof(L, W, O, pitch, s.waste);
  const cur = s.cur;
  const sq = (m2: number) => (metric ? `${formatNumber(m2, 1)} m²` : `${formatNumber(m2 / M2_PER_FT2, 0)} ft²`);
  const len = (m: number) => (metric ? `${formatNumber(m, 2)} m` : `${formatNumber(m / M_PER_FT, 1)} ft`);
  // Simple gable: each rafter runs from the ridge over half the width, plus the overhang.
  const rafter = (W / 2 + O) * pitchFactor(pitch);

  return (
    <section aria-label="Roofing calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={metric ? 'metric' : 'imperial'}
            onChange={(v) => set('u', v)}
            tabs={[
              { value: 'imperial', label: 'US (ft)' },
              { value: 'metric', label: 'Metric (m)' },
            ]}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium">Building footprint</p>
            <div className="grid grid-cols-3 items-start gap-3">
              {metric ? (
                <>
                  <NumberField label="Length" value={s.l} onChange={(v) => set('l', v)} suffix="m" min={0} decimals={2} />
                  <NumberField label="Width" value={s.w} onChange={(v) => set('w', v)} suffix="m" min={0} decimals={2} />
                  <NumberField label="Overhang" value={s.o} onChange={(v) => set('o', v)} suffix="m" min={0} max={3} decimals={2} />
                </>
              ) : (
                <>
                  <NumberField label="Length" value={s.lft} onChange={(v) => set('lft', v)} suffix="ft" min={0} decimals={1} />
                  <NumberField label="Width" value={s.wft} onChange={(v) => set('wft', v)} suffix="ft" min={0} decimals={1} />
                  <NumberField label="Overhang" value={s.oft} onChange={(v) => set('oft', v)} suffix="ft" min={0} max={10} decimals={1} />
                </>
              )}
            </div>
          </div>
          <div>
            <NumberField label="Roof pitch (rise per 12 of run)" value={s.pitch} onChange={(v) => set('pitch', v)} suffix="/ 12" min={0} max={24} decimals={1} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PITCHES.map((p) => (
                <button key={p} type="button" onClick={() => set('pitch', p)} className={`h-8 rounded-lg border px-2.5 text-xs font-medium ${pitch === p ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface hover:border-brand'}`}>
                  {p}/12
                </button>
              ))}
            </div>
          </div>
          <NumberField label="Extra for waste" value={s.waste} onChange={(v) => set('waste', v)} suffix="%" min={0} max={40} decimals={0} hint="10% for a simple gable, 15% or more for hips and valleys." />
          <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-3">
            <NumberField label="Price per square (100 ft²)" value={s.price} onChange={(v) => set('price', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} hint="Optional, materials or installed." />
            <CurrencyPicker label="Currency" value={cur} onChange={(v) => set('cur', v)} codes={CURRENCY_CODES} />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!r ? (
            <p className="text-sm text-muted">Enter the building’s length and width.</p>
          ) : (
            <>
              <Headline label="Roof area" value={sq(r.area)} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                {sq(r.footprint)} footprint × {formatNumber(pitchFactor(pitch), 3)} for a {formatNumber(pitch, 1)}/12 pitch ({formatNumber(pitchDegrees(pitch), 1)}°)
              </p>
              <div className="mt-6 rounded-xl border border-brand/40 bg-brand-soft/60 p-4">
                <p className="text-sm font-semibold">Shingles to buy (with {s.waste}% waste)</p>
                <p className="mt-1 text-lg font-bold">
                  {formatNumber(Math.ceil(r.squares - 1e-9), 0)} squares · {formatNumber(r.bundles, 0)} bundles
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatNumber(r.squares, 2)} squares of 100 ft²; 3 bundles per square for standard shingles
                  {s.price > 0 && ` · about ${formatMoney(Math.ceil(r.squares - 1e-9) * s.price, cur, 2)}`}
                </p>
              </div>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Area with waste', sq(r.withWaste)],
                    ['Pitch multiplier', `× ${formatNumber(pitchFactor(pitch), 3)}`],
                    ['Roof angle', `${formatNumber(pitchDegrees(pitch), 1)}°`],
                    ['Rafter length (gable)', len(rafter)],
                  ]}
                />
              </div>
              <p className="mt-4 text-xs text-muted">Assumes a simple gable or hip roof over a rectangle. Add ridge caps, starter strips and underlayment separately. Roof work at height is dangerous; use a professional.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
