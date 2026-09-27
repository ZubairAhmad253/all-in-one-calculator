import { useState } from 'react';
import { addMatrices, determinant, dims, inverse, multiplyMatrices, transpose, type Matrix } from '@/lib/calculators/stats';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { NumberField, SelectField } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { a: '2,1;1,3', b: '1,2;0,1', op: 'mul', k: 2 };
const SIZES = [1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }));

const OPS = [
  { value: 'mul', label: 'A × B' },
  { value: 'add', label: 'A + B' },
  { value: 'sub', label: 'A − B' },
  { value: 'det', label: 'Determinant of A' },
  { value: 'inv', label: 'Inverse of A' },
  { value: 'tr', label: 'Transpose of A' },
  { value: 'scale', label: 'k × A' },
  { value: 'pow', label: 'A²' },
];

/** "1,2;3,4" ⇄ [[1,2],[3,4]]; blank or invalid cells read as 0. */
const decode = (t: string): Matrix => {
  const rows = t.split(';').map((r) => r.split(',').map((c) => (Number.isFinite(Number(c)) ? Number(c) : 0)));
  const cols = Math.min(5, Math.max(1, ...rows.map((r) => r.length)));
  return rows.slice(0, 5).map((r) => Array.from({ length: cols }, (_, j) => r[j] ?? 0));
};
const encode = (m: Matrix) => m.map((r) => r.join(',')).join(';');

const resize = (m: Matrix, rows: number, cols: number): Matrix => Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => m[i]?.[j] ?? 0));

const num = (v: number) => {
  const r = Number(v.toPrecision(10));
  return (Object.is(r, -0) ? 0 : r).toLocaleString('en', {
    maximumFractionDigits: 6,
  });
};

function Cell({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      value={text ?? String(value)}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value.trim() === '' || Number.isFinite(n)) onChange(e.target.value.trim() === '' ? 0 : n);
      }}
      onBlur={() => setText(null)}
      className="tabular h-11 w-full min-w-0 rounded-lg border border-line bg-surface px-1 text-center font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
    />
  );
}

function MatrixInput({ name, m, onChange }: { name: string; m: Matrix; onChange: (m: Matrix) => void }) {
  const [r, c] = dims(m);
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">Matrix {name}</legend>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <SelectField label="Rows" value={r} onChange={(v) => onChange(resize(m, v, c))} options={SIZES} />
        <SelectField label="Columns" value={c} onChange={(v) => onChange(resize(m, r, v))} options={SIZES} />
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${c}, minmax(0, 1fr))` }}>
        {m.map((row, i) =>
          row.map((v, j) => (
            <Cell
              key={`${i}-${j}-${r}x${c}`}
              label={`${name} row ${i + 1} column ${j + 1}`}
              value={v}
              onChange={(nv) => onChange(m.map((rr, ii) => rr.map((vv, jj) => (ii === i && jj === j ? nv : vv))))}
            />
          )),
        )}
      </div>
    </fieldset>
  );
}

function MatrixView({ m }: { m: Matrix }) {
  const [, c] = dims(m);
  return (
    <div className="inline-block max-w-full overflow-x-auto rounded-xl border-x-2 border-fg/70 px-2 py-1">
      <table className="tabular text-lg font-semibold">
        <tbody>
          {m.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td key={j} className="px-3 py-1 text-right" style={{ minWidth: c > 3 ? '3.5rem' : '4.5rem' }}>
                  {num(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MatrixCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const a = decode(s.a);
  const b = decode(s.b);
  const op = OPS.some((o) => o.value === s.op) ? s.op : 'mul';
  const needsB = op === 'mul' || op === 'add' || op === 'sub';
  const [ar, ac] = dims(a);
  const [br, bc] = dims(b);

  let result: Matrix | null = null;
  let scalar: number | null = null;
  let error = '';
  switch (op) {
    case 'mul':
      result = multiplyMatrices(a, b);
      if (!result) error = `A has ${ac} column${ac === 1 ? '' : 's'} but B has ${br} row${br === 1 ? '' : 's'}. To multiply, A’s columns must equal B’s rows.`;
      break;
    case 'add':
    case 'sub':
      result = addMatrices(a, b, op === 'add' ? 1 : -1);
      if (!result) error = `A is ${ar}×${ac} and B is ${br}×${bc}. Matrices must be the same size to ${op === 'add' ? 'add' : 'subtract'}.`;
      break;
    case 'det':
      scalar = determinant(a);
      if (scalar === null) error = 'Only square matrices have a determinant. Make A’s rows equal its columns.';
      break;
    case 'inv':
      if (ar !== ac) error = 'Only square matrices can have an inverse.';
      else {
        result = inverse(a);
        if (!result) error = 'This matrix is singular (its determinant is 0), so it has no inverse.';
      }
      break;
    case 'tr':
      result = transpose(a);
      break;
    case 'scale':
      result = a.map((row) => row.map((v) => v * s.k));
      break;
    case 'pow':
      result = multiplyMatrices(a, a);
      if (!result) error = 'Only square matrices can be squared.';
      break;
  }
  const det = ar === ac ? determinant(a) : null;

  return (
    <section aria-label="Matrix calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-6 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <SelectField label="Operation" value={op} onChange={(v) => set('op', v)} options={OPS} />
          <MatrixInput name="A" m={a} onChange={(m) => set('a', encode(m))} />
          {needsB && <MatrixInput name="B" m={b} onChange={(m) => set('b', encode(m))} />}
          {op === 'scale' && <NumberField label="Scalar (k)" value={s.k} onChange={(v) => set('k', v)} decimals={6} />}
          <div className="flex flex-wrap gap-2">
            {needsB && (
              <button
                type="button"
                onClick={() => {
                  set('a', s.b);
                  set('b', s.a);
                }}
                className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg"
              >
                Swap A and B
              </button>
            )}
            <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-muted">{OPS.find((o) => o.value === op)!.label} =</p>
            <ShareButton />
          </div>
          <div className="mt-3">
            {error ? (
              <p className="rounded-xl border border-warn/40 bg-surface p-4 text-sm text-warn">{error}</p>
            ) : scalar !== null ? (
              <p className="tabular text-5xl font-bold tracking-tight">{num(scalar)}</p>
            ) : (
              result && <MatrixView m={result} />
            )}
          </div>
          {result && !error && (
            <p className="mt-3 text-xs text-muted">
              Result is {dims(result)[0]} × {dims(result)[1]}.
            </p>
          )}
          {op === 'det' && ar === 2 && ac === 2 && (
            <p className="tabular mt-4 text-sm text-muted">
              ad − bc = {num(a[0][0])} × {num(a[1][1])} − {num(a[0][1])} × {num(a[1][0])} = {num(det ?? 0)}
            </p>
          )}
          {op === 'inv' && result && det !== null && <p className="tabular mt-4 text-sm text-muted">det(A) = {num(det)}. Check: A × A⁻¹ = I.</p>}
          {op === 'mul' && result && <p className="mt-4 text-xs text-muted">Each entry is a row of A times a column of B, multiplied pairwise and added. Note A × B usually differs from B × A.</p>}
          {det !== null && op !== 'det' && op !== 'inv' && <p className="tabular mt-4 text-xs text-muted">det(A) = {num(det)}</p>}
        </div>
      </div>
    </section>
  );
}
