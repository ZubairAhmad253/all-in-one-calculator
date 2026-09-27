import { pythagoras } from '@/lib/calculators/geometry';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, Tabs } from '@/components/ui/fields';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { solve: 'c', a: 3, b: 4, c: 5 };
const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];

const f = (v: number, d = 6) => (Number.isFinite(v) ? Number(v.toFixed(d)).toLocaleString('en', { maximumFractionDigits: d }) : '—');

/** Right triangle with the right angle bottom-left, legs a (vertical) and b (horizontal). */
function Diagram({ a, b, solve }: { a: number; b: number; solve: string }) {
  const W = 220;
  const H = 150;
  const scale = Math.min((W - 60) / b, (H - 40) / a);
  const w = b * scale;
  const h = a * scale;
  const x0 = 30;
  const y0 = H - 20;
  const hl = (k: string) => (k === solve ? 'var(--brand)' : 'currentColor');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-40 w-full max-w-xs text-fg" role="img" aria-label={`Right triangle with legs a and b and hypotenuse c`}>
      <polygon points={`${x0},${y0} ${x0 + w},${y0} ${x0},${y0 - h}`} fill="var(--brand-soft)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x={x0} y={y0 - 10} width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" />
      <text x={x0 - 10} y={y0 - h / 2} textAnchor="end" dominantBaseline="middle" fontSize="13" fontWeight="600" fill={hl('a')}>
        a
      </text>
      <text x={x0 + w / 2} y={y0 + 15} textAnchor="middle" fontSize="13" fontWeight="600" fill={hl('b')}>
        b
      </text>
      <text x={x0 + w / 2 + 8} y={y0 - h / 2 - 6} fontSize="13" fontWeight="600" fill={hl('c')}>
        c
      </text>
    </svg>
  );
}

export default function PythagoreanTheoremCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const solve = s.solve === 'a' || s.solve === 'b' ? s.solve : 'c';
  const t = pythagoras(solve === 'a' ? NaN : s.a, solve === 'b' ? NaN : s.b, solve === 'c' ? NaN : s.c);
  const field = { min: 0, decimals: 6 };

  let working = '';
  if (t) {
    if (solve === 'c') working = `c = √(a² + b²) = √(${f(s.a ** 2)} + ${f(s.b ** 2)}) = √${f(s.a ** 2 + s.b ** 2)} = ${f(t.c)}`;
    else if (solve === 'a') working = `a = √(c² − b²) = √(${f(s.c ** 2)} − ${f(s.b ** 2)}) = √${f(s.c ** 2 - s.b ** 2)} = ${f(t.a)}`;
    else working = `b = √(c² − a²) = √(${f(s.c ** 2)} − ${f(s.a ** 2)}) = √${f(s.c ** 2 - s.a ** 2)} = ${f(t.b)}`;
  }

  return (
    <section aria-label="Pythagorean theorem calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div>
            <p className="mb-1.5 text-sm font-medium">Solve for</p>
            <Tabs
              value={solve}
              onChange={(v) => set('solve', v)}
              tabs={[
                { value: 'c', label: 'Hypotenuse c' },
                { value: 'a', label: 'Leg a' },
                { value: 'b', label: 'Leg b' },
              ]}
            />
          </div>
          {solve !== 'a' && <NumberField label="Leg a" value={s.a} onChange={(v) => set('a', v)} {...field} />}
          {solve !== 'b' && <NumberField label="Leg b" value={s.b} onChange={(v) => set('b', v)} {...field} />}
          {solve !== 'c' && <NumberField label="Hypotenuse c (longest side)" value={s.c} onChange={(v) => set('c', v)} {...field} />}
          <div>
            <p className="mb-1.5 text-sm font-medium">Try a Pythagorean triple</p>
            <div className="flex flex-wrap gap-2">
              {TRIPLES.map(([a, b, c]) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    set('a', a);
                    set('b', b);
                    set('c', c);
                  }}
                  className="tabular h-9 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:border-brand"
                >
                  {a}-{b}-{c}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {!t ? (
            <p className="text-sm text-warn">{solve === 'c' ? 'Enter two positive leg lengths.' : 'The hypotenuse must be longer than the leg you entered.'}</p>
          ) : (
            <>
              <Headline label={solve === 'c' ? 'Hypotenuse (c)' : `Leg ${solve}`} value={f(solve === 'c' ? t.c : solve === 'a' ? t.a : t.b)} action={<ShareButton />} />
              <p className="tabular mt-2 text-sm text-muted break-words">{working}</p>
              <div className="my-5">
                <Diagram a={t.a} b={t.b} solve={solve} />
              </div>
              <StatGrid
                items={[
                  ['Sides a, b, c', `${f(t.a, 4)}, ${f(t.b, 4)}, ${f(t.c, 4)}`],
                  ['Angle opposite a', `${f(t.angleA, 4)}°`],
                  ['Angle opposite b', `${f(t.angleB, 4)}°`],
                  ['Area', f(t.area)],
                  ['Perimeter', f(t.perimeter)],
                  ['Height to hypotenuse', f(t.height)],
                ]}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
