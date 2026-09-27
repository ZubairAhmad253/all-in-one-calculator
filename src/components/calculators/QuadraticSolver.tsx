import { quadratic } from '@/lib/calculators/numbers';
import { formatResult } from '@/lib/calculators/expression';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { a: 1, b: -5, c: 6 };
const n = (v: number) => formatResult(v).replace('-', '−');
const signed = (v: number) => (v < 0 ? `− ${n(-v)}` : `+ ${n(v)}`);
const bracket = (v: number) => (v < 0 ? `(${n(v)})` : n(v));

/** Small plot of y = ax² + bx + c around the vertex, with the roots marked. */
function Parabola({ a, b, c, roots }: { a: number; b: number; c: number; roots: number[] }) {
  const vx = a !== 0 ? -b / (2 * a) : 0;
  const span = Math.max(4, ...roots.map((r) => Math.abs(r - vx) * 1.6));
  const xs = Array.from({ length: 81 }, (_, i) => vx - span + (2 * span * i) / 80);
  const ys = xs.map((x) => a * x * x + b * x + c);
  const yMin = Math.min(0, ...ys);
  const yMax = Math.max(0, ...ys);
  const W = 320;
  const H = 220;
  const px = (x: number) => ((x - xs[0]) / (xs.at(-1)! - xs[0])) * W;
  const py = (y: number) => H - ((y - yMin) / (yMax - yMin || 1)) * H;
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)},${py(ys[i]).toFixed(1)}`).join('');
  return (
    <svg viewBox={`-10 -10 ${W + 20} ${H + 20}`} className="w-full max-w-md" role="img" aria-label={`Graph of y = ${n(a)}x² ${signed(b)}x ${signed(c)}`}>
      <line x1={0} x2={W} y1={py(0)} y2={py(0)} stroke="var(--line)" strokeWidth="1.5" />
      {xs[0] <= 0 && xs.at(-1)! >= 0 && <line x1={px(0)} x2={px(0)} y1={0} y2={H} stroke="var(--line)" strokeWidth="1.5" />}
      <path d={d} fill="none" stroke="var(--chart-1)" strokeWidth="2.5" />
      {roots.map((r) => (
        <circle key={r} cx={px(r)} cy={py(0)} r="5" fill="var(--surface)" stroke="var(--chart-2)" strokeWidth="2.5" />
      ))}
      {a !== 0 && <circle cx={px(vx)} cy={py(a * vx * vx + b * vx + c)} r="4" fill="var(--chart-3)" />}
    </svg>
  );
}

export default function QuadraticSolver() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const r = quadratic(s.a, s.b, s.c);
  const real = r.roots.filter((x) => x.im === 0).map((x) => x.re);
  const root = (x: { re: number; im: number }) => (x.im === 0 ? n(x.re) : `${n(x.re)} ${x.im < 0 ? '−' : '+'} ${n(Math.abs(x.im))}i`);

  return (
    <section aria-label="Quadratic equation solver" className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-5 text-2xl font-semibold sm:p-7">
        <InlineNumber label="a" value={s.a} onChange={(v) => set('a', v)} width="w-20" />
        <span>x² +</span>
        <InlineNumber label="b" value={s.b} onChange={(v) => set('b', v)} width="w-20" />
        <span>x +</span>
        <InlineNumber label="c" value={s.c} onChange={(v) => set('c', v)} width="w-20" />
        <span>= 0</span>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
          <ShareButton />
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-2" aria-live="polite">
        <div>
          <p className="text-sm font-medium text-muted">
            {r.kind === 'two' ? 'Two real roots' : r.kind === 'one' ? 'One repeated root' : r.kind === 'complex' ? 'Two complex roots' : r.kind === 'linear' ? 'Linear equation (a = 0)' : 'No single solution'}
          </p>
          <p className="tabular mt-1 text-3xl font-bold tracking-tight">
            {r.roots.length ? r.roots.map((x, i) => <span key={i} className="block">x = {root(x)}</span>) : b0c(s.b, s.c)}
          </p>

          {r.kind !== 'linear' && r.kind !== 'none' && (
            <ol className="tabular mt-6 list-decimal space-y-2 pl-5 text-sm leading-6">
              <li>Discriminant: b² − 4ac = {bracket(s.b)}² − 4 × {bracket(s.a)} × {bracket(s.c)} = <strong>{n(r.discriminant)}</strong></li>
              <li>
                {r.discriminant > 0 ? 'Positive, so there are two real roots.' : r.discriminant === 0 ? 'Zero, so there is one repeated root.' : 'Negative, so the roots are complex (no real solutions).'}
              </li>
              <li>
                x = (−b ± √(b² − 4ac)) ÷ 2a = ({n(-s.b)} ± √{bracket(r.discriminant)}) ÷ {n(2 * s.a)}
              </li>
            </ol>
          )}
          {r.vertex && (
            <dl className="tabular mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-line bg-surface p-3">
                <dt className="text-xs text-muted">Vertex</dt>
                <dd className="font-semibold">({n(r.vertex.x)}, {n(r.vertex.y)})</dd>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3">
                <dt className="text-xs text-muted">Axis of symmetry</dt>
                <dd className="font-semibold">x = {n(r.vertex.x)}</dd>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3">
                <dt className="text-xs text-muted">y-intercept</dt>
                <dd className="font-semibold">(0, {n(s.c)})</dd>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3">
                <dt className="text-xs text-muted">Opens</dt>
                <dd className="font-semibold">{s.a > 0 ? 'Upwards (minimum)' : 'Downwards (maximum)'}</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="flex items-center justify-center rounded-xl bg-surface-2 p-4">
          {s.a !== 0 ? <Parabola a={s.a} b={s.b} c={s.c} roots={real} /> : <p className="text-sm text-muted">Enter a non-zero a to see the parabola.</p>}
        </div>
      </div>
    </section>
  );
}

/** Message when a = 0 and b = 0: either every x works (c = 0) or none does. */
function b0c(b: number, c: number) {
  return b === 0 ? (c === 0 ? 'Every x is a solution' : 'No solution') : '';
}
