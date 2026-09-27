import { InlineNumber } from '@/components/ui/fields';

export const MAX_YEARS = 30;

/** Cash flows live in the URL as "3000,4000,4000,3000". */
export const decodeFlows = (s: string) =>
  s
    .split(',')
    .filter((x) => x.trim() !== '')
    .slice(0, MAX_YEARS)
    .map((x) => Number(x) || 0);
export const encodeFlows = (flows: number[]) => flows.map((v) => String(Math.round(v * 100) / 100)).join(',');

/** Editable list of yearly cash flows (negative values allowed). */
export function CashFlowList({ flows, onChange, symbol }: { flows: number[]; onChange: (flows: number[]) => void; symbol: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Cash flow each year</p>
      <ol className="space-y-2">
        {flows.map((v, i) => (
          <li key={i} className="grid grid-cols-[4.5rem_minmax(0,1fr)_2rem] items-center gap-2">
            <span className="text-sm text-muted">Year {i + 1}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted">{symbol}</span>
              <InlineNumber label={`Year ${i + 1} cash flow`} value={v} onChange={(x) => onChange(flows.map((f, j) => (j === i ? x : f)))} width="w-full" />
            </div>
            {flows.length > 1 ? (
              <button type="button" onClick={() => onChange(flows.filter((_, j) => j !== i))} aria-label={`Remove year ${i + 1}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                ✕
              </button>
            ) : (
              <span />
            )}
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled={flows.length >= MAX_YEARS}
        onClick={() => onChange([...flows, flows.at(-1) ?? 0])}
        className="mt-3 h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-brand/40 disabled:opacity-50"
      >
        + Add year
      </button>
      <p className="mt-2 text-xs text-muted">Enter money coming in as positive and extra spending as negative.</p>
    </div>
  );
}
