import { solveAAS, solveSAS, solveSSA, solveSSS, type Triangle } from '@/lib/calculators/geometry';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { m: 'sss', a: 7, b: 8, c: 9, A: 40, B: 60, C: 50 };

const METHODS = [
  { value: 'sss', label: 'Three sides (SSS)' },
  { value: 'sas', label: 'Two sides and the angle between (SAS)' },
  { value: 'asa', label: 'Two angles and the side between (ASA)' },
  { value: 'aas', label: 'Two angles and another side (AAS)' },
  { value: 'ssa', label: 'Two sides and another angle (SSA)' },
];

/** Which inputs each method uses. */
const INPUTS: Record<string, string[]> = {
  sss: ['a', 'b', 'c'],
  sas: ['a', 'b', 'C'],
  asa: ['A', 'c', 'B'],
  aas: ['A', 'B', 'a'],
  ssa: ['a', 'b', 'A'],
};

const LABELS: Record<string, string> = {
  a: 'Side a',
  b: 'Side b',
  c: 'Side c',
  A: 'Angle A (opposite a)',
  B: 'Angle B (opposite b)',
  C: 'Angle C (opposite c)',
};

const f = (v: number, d = 4) => (Number.isFinite(v) ? Number(v.toFixed(d)).toLocaleString('en', { maximumFractionDigits: d }) : '—');

function Diagram({ t }: { t: Triangle }) {
  // Vertex A at the origin, B along the x-axis, C above.
  const pts = [
    [0, 0],
    [t.c, 0],
    [t.b * Math.cos((t.A * Math.PI) / 180), t.b * Math.sin((t.A * Math.PI) / 180)],
  ];
  const xs = pts.map((p) => p[0]);
  const minX = Math.min(...xs);
  const w = Math.max(...xs) - minX;
  const h = pts[2][1];
  const W = 260;
  const H = 170;
  const k = Math.min((W - 50) / w, (H - 50) / h);
  const P = pts.map(([x, y]) => [25 + (x - minX) * k + (W - 50 - w * k) / 2, H - 25 - y * k]);
  const mid = (i: number, j: number) => [(P[i][0] + P[j][0]) / 2, (P[i][1] + P[j][1]) / 2];
  const cx = (P[0][0] + P[1][0] + P[2][0]) / 3;
  const cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
  const out = ([x, y]: number[], d: number) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [x + (dx / len) * d, y + (dy / len) * d];
  };
  const label = (p: number[], text: string, bold = false) => (
    <text x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight={bold ? 700 : 500} fill={bold ? 'currentColor' : 'var(--muted)'}>
      {text}
    </text>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-44 w-full max-w-sm text-fg" role="img" aria-label="Diagram of the solved triangle">
      <polygon points={P.map((p) => p.join(',')).join(' ')} fill="var(--brand-soft)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {label(out(P[0], 12), 'A', true)}
      {label(out(P[1], 12), 'B', true)}
      {label(out(P[2], 12), 'C', true)}
      {label(out(mid(1, 2), 12), 'a')}
      {label(out(mid(0, 2), 12), 'b')}
      {label(out(mid(0, 1), 12), 'c')}
    </svg>
  );
}

function Solution({ t, title }: { t: Triangle; title?: string }) {
  return (
    <div>
      {title && <p className="mb-3 text-sm font-semibold">{title}</p>}
      <Diagram t={t} />
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        <table className="tabular w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Side</th>
              <th className="px-4 py-2 text-right font-medium">Length</th>
              <th className="px-4 py-2 font-medium">Angle</th>
              <th className="px-4 py-2 text-right font-medium">Degrees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(['a', 'b', 'c'] as const).map((s) => {
              const A = s.toUpperCase() as 'A' | 'B' | 'C';
              return (
                <tr key={s}>
                  <td className="px-4 py-2 font-medium">{s}</td>
                  <td className="px-4 py-2 text-right">{f(t[s])}</td>
                  <td className="px-4 py-2 font-medium">{A}</td>
                  <td className="px-4 py-2 text-right">{f(t[A])}°</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <StatGrid
          items={[
            ['Area', f(t.area)],
            ['Perimeter', f(t.perimeter)],
            ['Type', `${t.sideType[0].toUpperCase()}${t.sideType.slice(1)}, ${t.angleType}`],
            ['Heights ha, hb, hc', `${f(t.ha, 3)}, ${f(t.hb, 3)}, ${f(t.hc, 3)}`],
            ['Inradius', f(t.inradius)],
            ['Circumradius', f(t.circumradius)],
          ]}
        />
      </div>
    </div>
  );
}

export default function TriangleCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const m = INPUTS[s.m] ? s.m : 'sss';
  let solutions: Triangle[] = [];
  if (m === 'sss') solutions = [solveSSS(s.a, s.b, s.c)].filter((t): t is Triangle => !!t);
  if (m === 'sas') solutions = [solveSAS(s.a, s.b, s.C)].filter((t): t is Triangle => !!t);
  if (m === 'asa') solutions = [solveAAS(s.A, s.B, s.c, 'c')].filter((t): t is Triangle => !!t);
  if (m === 'aas') solutions = [solveAAS(s.A, s.B, s.a, 'a')].filter((t): t is Triangle => !!t);
  if (m === 'ssa') solutions = solveSSA(s.a, s.b, s.A);

  const why =
    m === 'sss'
      ? 'These sides can’t form a triangle: each side must be shorter than the other two added together.'
      : m === 'asa' || m === 'aas'
        ? 'The two angles must add up to less than 180°.'
        : m === 'ssa'
          ? 'No triangle fits: side a is too short to reach the base at that angle.'
          : 'Enter positive sides and an angle below 180°.';

  return (
    <section aria-label="Triangle calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <SelectField label="What do you know?" value={m} onChange={(v) => set('m', v)} options={METHODS} />
          {INPUTS[m].map((k) => (
            <NumberField
              key={k}
              label={LABELS[k]}
              value={s[k as keyof typeof s] as number}
              onChange={(v) => set(k as keyof typeof s, v)}
              min={0}
              max={k === k.toUpperCase() ? 180 : undefined}
              suffix={k === k.toUpperCase() ? '°' : undefined}
              decimals={6}
            />
          ))}
          <p className="text-xs text-muted">Side a is opposite angle A, b opposite B, and c opposite C. Use the same unit for every side.</p>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">{solutions.length === 2 ? 'Two triangles fit (the ambiguous case)' : 'Area'}</p>
              {solutions.length === 1 && <p className="tabular mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{f(solutions[0].area)}</p>}
            </div>
            <ShareButton />
          </div>
          {solutions.length === 0 && <p className="text-sm text-warn">{why}</p>}
          {solutions.length === 1 && <Solution t={solutions[0]} />}
          {solutions.length === 2 && (
            <div className="space-y-8">
              <Solution t={solutions[0]} title={`Triangle 1 (B = ${f(solutions[0].B, 2)}°)`} />
              <Solution t={solutions[1]} title={`Triangle 2 (B = ${f(solutions[1].B, 2)}°)`} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
