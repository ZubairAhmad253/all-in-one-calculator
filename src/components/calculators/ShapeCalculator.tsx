import { SHAPES_2D, SHAPES_3D, type ShapeField } from '@/lib/calculators/geometry';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

/** Metres per unit. */
const UNITS = [
  { value: 'mm', label: 'Millimetres (mm)', m: 0.001 },
  { value: 'cm', label: 'Centimetres (cm)', m: 0.01 },
  { value: 'm', label: 'Metres (m)', m: 1 },
  { value: 'km', label: 'Kilometres (km)', m: 1000 },
  { value: 'in', label: 'Inches (in)', m: 0.0254 },
  { value: 'ft', label: 'Feet (ft)', m: 0.3048 },
  { value: 'yd', label: 'Yards (yd)', m: 0.9144 },
  { value: 'mi', label: 'Miles (mi)', m: 1609.344 },
];

const f = (v: number, d = 6) =>
  Number.isFinite(v)
    ? Number(v.toPrecision(12)).toLocaleString('en', {
        maximumFractionDigits: d,
      })
    : '—';

/** Angle fields are in degrees rather than the length unit. */
const isAngle = (field: ShapeField) => field.label.includes('degrees');

const DEFAULTS = {
  area: {
    shape: 'rectangle',
    unit: 'm',
    l: 12,
    w: 8,
    s: 5,
    b: 10,
    h: 6,
    r: 4,
    a: 6,
    p: 6,
    q: 8,
    t: 60,
  },
  volume: { shape: 'box', unit: 'm', l: 4, w: 3, h: 2, s: 3, r: 2, b: 3, t: 2 },
};

export default function ShapeCalculator({ kind }: { kind: 'area' | 'volume' }) {
  const [s, set, reset] = useUrlState<Record<string, number | string>>(DEFAULTS[kind]);
  const shapes = kind === 'area' ? SHAPES_2D : SHAPES_3D;
  const key = (typeof s.shape === 'string' && s.shape in shapes ? s.shape : DEFAULTS[kind].shape) as string;
  const shape = shapes[key];
  const unit = UNITS.find((u) => u.value === s.unit) ?? UNITS[2];
  const values = Object.fromEntries(shape.fields.map((fd) => [fd.key, Number(s[fd.key])]));
  const valid = shape.fields.every((fd) => values[fd.key] > 0 && !(isAngle(fd) && values[fd.key] > 360));
  const u = unit.value;

  let main = Number.NaN;
  let second: number | undefined;
  if (valid) {
    if (kind === 'area') {
      const sh = SHAPES_2D[key];
      main = sh.area(values);
      second = sh.perimeter?.(values);
    } else {
      const sh = SHAPES_3D[key];
      main = sh.volume(values);
      second = sh.surface(values);
    }
  }

  const m2 = main * unit.m ** 2;
  const m3 = main * unit.m ** 3;
  const conversions: [string, string][] =
    kind === 'area'
      ? [
          ['Square metres', `${f(m2)} m²`],
          ['Square feet', `${f(m2 / 0.09290304)} ft²`],
          ['Acres', f(m2 / 4046.8564224)],
          ['Hectares', f(m2 / 10_000)],
        ]
      : [
          ['Cubic metres', `${f(m3)} m³`],
          ['Litres', `${f(m3 * 1000)} L`],
          ['US gallons', `${f(m3 / 0.003785411784)} gal`],
          ['Cubic feet', `${f(m3 / 0.028316846592)} ft³`],
        ];

  return (
    <section aria-label={`${kind === 'area' ? 'Area' : 'Volume'} calculator`} className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">Shape</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {Object.entries(shapes).map(([k, sh]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={k === key}
                  onClick={() => set('shape', k)}
                  className={`h-10 rounded-lg border px-2 text-sm font-medium transition ${k === key ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface hover:border-brand/50'}`}
                >
                  {sh.label}
                </button>
              ))}
            </div>
          </div>
          <SelectField label="Unit" value={u} onChange={(v) => set('unit', v)} options={UNITS.map(({ value, label }) => ({ value, label }))} />
          {shape.fields.map((fd) => (
            <NumberField
              key={`${key}-${fd.key}`}
              label={fd.label}
              value={Number(s[fd.key])}
              onChange={(v) => set(fd.key, v)}
              min={0}
              max={isAngle(fd) ? 360 : undefined}
              suffix={isAngle(fd) ? '°' : u}
              decimals={6}
            />
          ))}
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!valid ? (
            <p className="text-sm text-warn">
              Enter positive measurements
              {shape.fields.some(isAngle) ? ' and an angle up to 360°' : ''}.
            </p>
          ) : (
            <>
              <Headline label={`${shape.label} ${kind}`} value={`${f(main)} ${u}${kind === 'area' ? '²' : '³'}`} action={<ShareButton />} compact />
              <p className="tabular mt-2 text-sm text-muted">{shape.formula}</p>
              <div className="mt-6">
                <StatGrid
                  items={[
                    ...(second !== undefined
                      ? [[kind === 'area' ? (key === 'ellipse' ? 'Perimeter (approx.)' : 'Perimeter') : 'Surface area', `${f(second)} ${u}${kind === 'area' ? '' : '²'}`] as [string, string]]
                      : []),
                    ...conversions,
                  ]}
                />
              </div>
              {kind === 'volume' && key === 'prism' && <p className="mt-3 text-xs text-muted">Surface area assumes an isosceles triangle cross-section.</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
