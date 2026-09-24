import type { ReactNode } from 'react';
import { percentChange, percentDifference, percentOf, whatPercent } from '@/lib/calculators/percentage';
import { formatResult } from '@/lib/calculators/expression';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber } from '@/components/ui/fields';
import { ShareButton } from './shared/results';

const DEFAULTS = { p1: 15, v1: 200, a2: 30, b2: 200, f3: 80, t3: 100, a4: 80, b4: 100 };

/** Number for display: at most 4 decimal places, with a proper minus sign. */
const n = (v: number) => formatResult(Number(v.toFixed(4))).replace('-', '−');
/** Same, bracketed when negative, for use after a minus sign. */
const nb = (v: number) => (v < 0 ? `(${n(v)})` : n(v));

function Card({ title, children, result, working, note }: { title: string; children: ReactNode; result: string; working: string; note?: string }) {
  return (
    <section className="card flex flex-col p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-muted">{title}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-lg">{children}</div>
      <div className="mt-5 rounded-xl bg-surface-2 px-4 py-3" aria-live="polite">
        <p className="tabular text-3xl font-bold tracking-tight">{result}</p>
        <p className="tabular mt-1 text-sm text-muted">{working}</p>
        {note && <p className="mt-1 text-sm font-medium">{note}</p>}
      </div>
    </section>
  );
}

export default function PercentageCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);

  const r1 = percentOf(s.p1, s.v1);
  const r2 = whatPercent(s.a2, s.b2);
  const r3 = percentChange(s.f3, s.t3);
  const r4 = percentDifference(s.a4, s.b4);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Percentage of a number" result={n(r1)} working={`${n(s.p1)} ÷ 100 × ${n(s.v1)} = ${n(r1)}`}>
          <span>What is</span>
          <InlineNumber label="Percentage" value={s.p1} onChange={(v) => set('p1', v)} width="w-20" />
          <span>% of</span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <InlineNumber label="Number" value={s.v1} onChange={(v) => set('v1', v)} />?
          </span>
        </Card>

        <Card
          title="What percent is it?"
          result={Number.isNaN(r2) ? '—' : `${n(r2)}%`}
          working={Number.isNaN(r2) ? 'Can’t work out a percentage of 0.' : `${n(s.a2)} ÷ ${n(s.b2)} × 100 = ${n(r2)}%`}
        >
          <InlineNumber label="Part" value={s.a2} onChange={(v) => set('a2', v)} />
          <span>is what % of</span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <InlineNumber label="Whole" value={s.b2} onChange={(v) => set('b2', v)} />?
          </span>
        </Card>

        <Card
          title="Percentage change"
          result={Number.isNaN(r3) ? '—' : `${r3 > 0 ? '+' : ''}${n(r3)}%`}
          working={Number.isNaN(r3) ? 'A change from 0 has no percentage: any increase from 0 is infinite.' : `(${n(s.t3)} − ${nb(s.f3)}) ÷ ${n(Math.abs(s.f3))} × 100 = ${n(r3)}%`}
          note={Number.isNaN(r3) ? undefined : r3 > 0 ? `A ${n(r3)}% increase` : r3 < 0 ? `A ${n(-r3)}% decrease` : 'No change'}
        >
          <span>From</span>
          <InlineNumber label="Starting value" value={s.f3} onChange={(v) => set('f3', v)} />
          <span>to</span>
          <InlineNumber label="New value" value={s.t3} onChange={(v) => set('t3', v)} />
        </Card>

        <Card
          title="Percentage difference"
          result={Number.isNaN(r4) ? '—' : `${n(r4)}%`}
          working={
            Number.isNaN(r4) ? 'Both values are 0, so there is no difference to measure.' : `|${n(s.a4)} − ${nb(s.b4)}| ÷ ((${n(Math.abs(s.a4))} + ${n(Math.abs(s.b4))}) ÷ 2) × 100 = ${n(r4)}%`
          }
        >
          <span>Between</span>
          <InlineNumber label="First value" value={s.a4} onChange={(v) => set('a4', v)} />
          <span>and</span>
          <InlineNumber label="Second value" value={s.b4} onChange={(v) => set('b4', v)} />
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
          Reset
        </button>
        <ShareButton />
      </div>
    </div>
  );
}
