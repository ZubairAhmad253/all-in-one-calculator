import { concreteVolume, CONCRETE_BAGS, M3_PER_YD3, M_PER_FT, type ConcreteShape } from '@/lib/calculators/build';
import { CURRENCIES, currencySymbol, formatMoney, formatNumber, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

// Metric: lengths in m, thickness and diameters in cm. US: lengths in ft, thickness and diameters in in.
const DEFAULTS = { u: 'metric', shape: 'slab', a: 3, b: 3, c: 10, af: 10, bf: 10, cf: 4, n: 1, waste: 10, price: 0, cur: 'USD' };

const IN = 0.0254;
const DENSITY = 2400; // kg per m³, typical normal-weight concrete

export default function ConcreteCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const metric = s.u !== 'imperial';
  const shape = (['slab', 'column', 'tube'].includes(s.shape) ? s.shape : 'slab') as ConcreteShape;
  const n = Math.max(1, Math.round(s.n));

  // Convert inputs to metres for each shape's three measurements.
  const L = (m: number, ft: number) => (metric ? m : ft * M_PER_FT);
  const small = (cm: number, inch: number) => (metric ? cm / 100 : inch * IN);
  let dims: [number, number, number];
  if (shape === 'slab') dims = [L(s.a, s.af), L(s.b, s.bf), small(s.c, s.cf)];
  else if (shape === 'column') dims = [small(s.a, s.af), L(s.b, s.bf), 0];
  else dims = [small(s.a, s.af), small(s.b, s.bf), L(s.c, s.cf)];

  const one = concreteVolume(shape, ...dims);
  const volume = one * n * (1 + Math.max(0, s.waste) / 100);
  const valid = Number.isFinite(volume) && volume > 0;
  const cur = s.cur;
  const lu = metric ? 'm' : 'ft';
  const su = metric ? 'cm' : 'in';

  const field = (label: string, key: 'a' | 'b' | 'c', unit: string) => {
    const k = metric ? key : (`${key}f` as 'af' | 'bf' | 'cf');
    return <NumberField label={label} value={s[k]} onChange={(v) => set(k, v)} suffix={unit} min={0} decimals={2} />;
  };

  return (
    <section aria-label="Concrete calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={metric ? 'metric' : 'imperial'}
            onChange={(v) => set('u', v)}
            tabs={[
              { value: 'metric', label: 'Metric (m, cm)' },
              { value: 'imperial', label: 'US (ft, in)' },
            ]}
          />
          <SelectField
            label="Shape"
            value={shape}
            onChange={(v) => {
              // Each shape starts from typical sizes, since the fields mean different things.
              const start = { slab: [3, 3, 10, 10, 10, 4], column: [30, 1, 0, 12, 4, 0], tube: [40, 20, 1, 16, 8, 4] }[v as ConcreteShape];
              (['a', 'b', 'c', 'af', 'bf', 'cf'] as const).forEach((k, i) => set(k, start[i]));
              set('shape', v);
            }}
            options={[
              { value: 'slab', label: 'Slab, footing or wall' },
              { value: 'column', label: 'Round column or post hole' },
              { value: 'tube', label: 'Hollow tube (e.g. around a pipe)' },
            ]}
          />
          <div className="grid grid-cols-3 items-start gap-3">
            {shape === 'slab' && (
              <>
                {field('Length', 'a', lu)}
                {field('Width', 'b', lu)}
                {field('Thickness', 'c', su)}
              </>
            )}
            {shape === 'column' && (
              <>
                {field('Diameter', 'a', su)}
                {field('Height / depth', 'b', lu)}
              </>
            )}
            {shape === 'tube' && (
              <>
                {field('Outer diameter', 'a', su)}
                {field('Inner diameter', 'b', su)}
                {field('Height', 'c', lu)}
              </>
            )}
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            <NumberField label="How many" value={s.n} onChange={(v) => set('n', v)} min={1} max={1000} decimals={0} />
            <NumberField label="Extra for waste" value={s.waste} onChange={(v) => set('waste', v)} suffix="%" min={0} max={50} decimals={0} hint="5–10% is typical" />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-3">
            <NumberField label={`Price per ${metric ? 'm³' : 'yd³'} (optional)`} value={s.price} onChange={(v) => set('price', v)} prefix={currencySymbol(cur)} locale={localeFor(cur)} min={0} decimals={2} />
            <SelectField label="Currency" value={cur} onChange={(v) => set('cur', v)} options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))} />
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-muted">Enter the measurements{shape === 'tube' ? ', with the inner diameter smaller than the outer' : ''}.</p>
          ) : (
            <>
              <Headline label="Concrete needed" value={metric ? `${formatNumber(volume, 2)} m³` : `${formatNumber(volume / M3_PER_YD3, 2)} yd³`} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                {metric ? `${formatNumber(volume / M3_PER_YD3, 2)} yd³` : `${formatNumber(volume, 2)} m³`} · {formatNumber(volume / M_PER_FT ** 3, 1)} ft³ · about {formatNumber((volume * DENSITY) / 1000, 1)} tonnes
                {s.waste > 0 && `, including ${s.waste}% extra`}
              </p>
              {s.price > 0 && <p className="mt-2 font-semibold">About {formatMoney((metric ? volume : volume / M3_PER_YD3) * s.price, cur, 2)} for ready-mix</p>}

              <p className="mt-6 mb-2 text-sm font-semibold">Or in premixed bags</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CONCRETE_BAGS.map((b) => (
                  <div key={b.id} className="rounded-xl border border-line bg-surface p-3">
                    <p className="text-xs text-muted">{b.label}</p>
                    <p className="tabular mt-1 text-xl font-bold">{formatNumber(Math.ceil(volume / b.yield - 1e-9), 0)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Volume of one', metric ? `${formatNumber(one, 3)} m³` : `${formatNumber(one / M_PER_FT ** 3, 2)} ft³`],
                    ['Number of pours', String(n)],
                  ]}
                />
              </div>
              <p className="mt-4 text-xs text-muted">Bags make sense for small jobs; for more than about 1 m³ (1.3 yd³), ready-mix delivery is usually cheaper and easier. Bag yields are typical; check the bag.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
