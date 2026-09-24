import { useState } from 'react';
import type { MonthRow, YearRow } from '@/lib/calculators/loan';
import { formatMoney, formatMoneyCompact } from '@/lib/format/number';
import { Tabs } from '@/components/ui/fields';
import { Donut, type DonutSegment } from '@/components/charts/Donut';
import { LineChart } from '@/components/charts/LineChart';

/** Donut with a value legend beside it (stacks on phones). */
export function BreakdownDonut({ segments, currency, center }: { segments: DonutSegment[]; currency: string; center: { label: string; value: string } }) {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <Donut segments={segments} size={168}>
        <div>
          <p className="text-xs text-muted">{center.label}</p>
          <p className="tabular text-sm font-semibold">{center.value}</p>
        </div>
      </Donut>
      <ul className="w-full flex-1 space-y-2.5 text-sm">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: seg.color }} />
            <span className="text-muted">{seg.label}</span>
            <span className="tabular ml-auto font-medium">{formatMoney(seg.value, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 2-column grid of labelled result values. */
export function StatGrid({ items }: { items: [label: string, value: string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-3">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-line bg-surface p-3.5">
          <dt className="text-xs text-muted">{k}</dt>
          <dd className="tabular mt-1 font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Headline result with an optional action on the right. */
export function Headline({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="tabular mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{value}</p>
      </div>
      {action}
    </div>
  );
}

/** Copies the current URL (which holds the inputs) to the clipboard. */
export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard blocked: the URL bar already holds the shareable link. */
    }
  };
  return (
    <button type="button" onClick={share} className="shrink-0 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90">
      {copied ? 'Link copied' : 'Share result'}
    </button>
  );
}

type View = 'chart' | 'yearly' | 'monthly';

interface AmortizationPanelProps {
  principal: number;
  yearly: YearRow[];
  /** Pass to enable the month-by-month tab. */
  monthly?: MonthRow[];
  currency: string;
  note: string;
  defaultView?: View;
}

/** Balance chart plus yearly (and optionally monthly) schedule tables. */
export function AmortizationPanel({ principal, yearly, monthly, currency, note, defaultView = 'chart' }: AmortizationPanelProps) {
  const [view, setView] = useState<View>(defaultView);
  const money = (v: number) => formatMoney(v, currency);

  let cumInterest = 0;
  let cumPrincipal = 0;
  const rows = [{ year: 0, balance: principal, interest: 0, principal: 0 }].concat(
    yearly.map((y) => ({ year: y.year, balance: y.balance, interest: (cumInterest += y.interest), principal: (cumPrincipal += y.principal) })),
  );

  const tabs: { value: View; label: string }[] = [
    { value: 'chart', label: 'Chart' },
    { value: 'yearly', label: 'Yearly' },
  ];
  if (monthly) tabs.push({ value: 'monthly', label: 'Monthly' });

  return (
    <div className="border-t border-line p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Amortization</h2>
        <Tabs value={view} onChange={setView} tabs={tabs} />
      </div>

      {view === 'chart' && (
        <div className="mt-5">
          <LineChart
            labels={rows.map((r) => r.year)}
            xTitle="Year"
            formatY={(v) => formatMoneyCompact(v, currency)}
            formatTooltip={money}
            series={[
              { label: 'Remaining balance', color: 'var(--chart-1)', values: rows.map((r) => r.balance), area: true },
              { label: 'Principal paid', color: 'var(--chart-2)', values: rows.map((r) => r.principal) },
              { label: 'Interest paid', color: 'var(--chart-3)', values: rows.map((r) => r.interest) },
            ]}
          />
        </div>
      )}

      {view === 'yearly' && (
        <ScheduleTable
          head={['Year', 'Principal', 'Interest', 'Balance']}
          rows={yearly.map((y) => [y.year, money(y.principal), money(y.interest), money(y.balance)])}
        />
      )}

      {view === 'monthly' && monthly && (
        <ScheduleTable
          head={['Month', 'Payment', 'Principal', 'Interest', 'Balance']}
          rows={monthly.map((m) => [m.month, money(m.payment), money(m.principal), money(m.interest), money(m.balance)])}
          yearBreaks
        />
      )}

      <p className="mt-3 text-xs text-muted">{note}</p>
    </div>
  );
}

function ScheduleTable({ head, rows, yearBreaks = false }: { head: string[]; rows: (string | number)[][]; yearBreaks?: boolean }) {
  return (
    <div className="mt-5 max-h-[28rem] overflow-auto rounded-xl border border-line">
      <table className="tabular w-full text-xs sm:text-sm">
        <thead className="sticky top-0 bg-surface-2 text-xs text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-3 py-2.5 font-medium sm:px-4 ${i === 0 ? 'text-left' : 'text-right'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((cells, r) => (
            <tr key={r} className={yearBreaks && r > 0 && r % 12 === 0 ? 'border-t-2 border-t-line' : ''}>
              {cells.map((c, i) => (
                <td key={i} className={`px-3 py-2 sm:px-4 ${i === 0 ? '' : 'text-right'} ${i === cells.length - 1 ? 'font-medium' : ''}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
