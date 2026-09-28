import { useMemo } from 'react';
import { payoffPlan, type Debt, type StrategyResult } from '@/lib/calculators/debt';
import { CURRENCY_CODES, localeFor, currencySymbol, formatDuration, formatMoney } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber, NumberField } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { ShareButton } from './shared/results';

const DEFAULT_DEBTS: Debt[] = [
  { name: 'Credit card', balance: 6_000, apr: 24, minPayment: 150 },
  { name: 'Store card', balance: 1_200, apr: 18, minPayment: 35 },
  { name: 'Car loan', balance: 9_000, apr: 6, minPayment: 250 },
];
const MAX = 10;

/** Debts live in the URL as "name~balance~apr~min|…", names URI-encoded. */
const encode = (ds: Debt[]) => ds.map((d) => [encodeURIComponent(d.name), d.balance, d.apr, d.minPayment].join('~')).join('|');
const decode = (s: string): Debt[] =>
  s
    .split('|')
    .filter(Boolean)
    .slice(0, MAX)
    .map((p, i) => {
      const [n = '', b = '0', a = '0', m = '0'] = p.split('~');
      let name = `Debt ${i + 1}`;
      try {
        name = decodeURIComponent(n) || name;
      } catch {
        /* keep default */
      }
      return { name, balance: Number(b) || 0, apr: Number(a) || 0, minPayment: Number(m) || 0 };
    });

const DEFAULTS = { d: encode(DEFAULT_DEBTS), extra: 200, cur: 'USD' };

function PlanCard({ title, subtitle, r, best, money }: { title: string; subtitle: string; r: StrategyResult; best: boolean; money: (v: number) => string }) {
  return (
    <div className={`rounded-xl border p-4 ${best ? 'border-accent bg-accent/5' : 'border-line bg-surface'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{title}</p>
        {best && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">Least interest</span>}
      </div>
      <p className="text-xs text-muted">{subtitle}</p>
      {r.paysOff ? (
        <>
          <dl className="tabular mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs text-muted">Debt-free in</dt>
              <dd className="font-semibold">{formatDuration(r.months)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Total interest</dt>
              <dd className="font-semibold">{money(r.totalInterest)}</dd>
            </div>
          </dl>
          <ol className="mt-3 space-y-1 text-sm">
            {r.order.map((o, i) => (
              <li key={o.name + i} className="flex justify-between gap-2">
                <span className="truncate">
                  {i + 1}. {o.name}
                </span>
                <span className="tabular shrink-0 text-muted">month {o.month}</span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-3 text-sm text-warn">This budget doesn’t cover the interest, so the debts would never be paid off.</p>
      )}
    </div>
  );
}

export default function DebtPayoffCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const debts = decode(s.d);
  const cur = s.cur;
  const sym = currencySymbol(cur);
  const loc = localeFor(cur);
  const money = (v: number) => formatMoney(v, cur);

  const snow = useMemo(() => payoffPlan(debts, s.extra, 'snowball'), [s.d, s.extra]); // eslint-disable-line react-hooks/exhaustive-deps
  const aval = useMemo(() => payoffPlan(debts, s.extra, 'avalanche'), [s.d, s.extra]); // eslint-disable-line react-hooks/exhaustive-deps
  const totalMin = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const totalBal = debts.reduce((sum, d) => sum + d.balance, 0);
  const saving = snow.paysOff && aval.paysOff ? snow.totalInterest - aval.totalInterest : 0;

  const update = (i: number, patch: Partial<Debt>) => set('d', encode(debts.map((d, j) => (j === i ? { ...d, ...patch } : d))));

  return (
    <section aria-label="Debt payoff calculator" className="card overflow-hidden">
      <div className="p-5 sm:p-7">
        <div className="hidden grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_2rem] gap-2 px-1 text-xs text-muted sm:grid">
          <span>Debt</span>
          <span>Balance</span>
          <span>APR %</span>
          <span>Minimum / month</span>
        </div>
        <ol className="mt-2 space-y-3 sm:space-y-2">
          {debts.map((d, i) => (
            <li key={i} className="grid grid-cols-3 items-center gap-2 rounded-xl border border-line p-3 sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_2rem] sm:rounded-none sm:border-0 sm:p-0">
              <input
                aria-label={`Debt ${i + 1} name`}
                value={d.name}
                maxLength={40}
                onChange={(e) => update(i, { name: e.target.value })}
                className="col-span-2 h-11 min-w-0 rounded-xl border border-line bg-surface px-3 text-sm font-medium outline-none focus:border-brand focus:ring-4 focus:ring-brand/15 sm:col-span-1"
              />
              <button
                type="button"
                onClick={() => debts.length > 1 && set('d', encode(debts.filter((_, j) => j !== i)))}
                disabled={debts.length <= 1}
                aria-label={`Remove ${d.name}`}
                className="grid size-8 place-items-center justify-self-end rounded-lg text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30 sm:order-last"
              >
                ✕
              </button>
              <InlineNumber label={`${d.name} balance`} value={d.balance} onChange={(v) => update(i, { balance: v })} width="w-full" allowNegative={false} />
              <InlineNumber label={`${d.name} APR`} value={d.apr} onChange={(v) => update(i, { apr: v })} width="w-full" allowNegative={false} />
              <InlineNumber label={`${d.name} minimum payment`} value={d.minPayment} onChange={(v) => update(i, { minPayment: v })} width="w-full" allowNegative={false} />
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted sm:hidden">Each row: name, then balance, APR % and minimum monthly payment.</p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <button
            type="button"
            disabled={debts.length >= MAX}
            onClick={() => set('d', encode([...debts, { name: `Debt ${debts.length + 1}`, balance: 1_000, apr: 18, minPayment: 30 }]))}
            className="h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-brand/40 disabled:opacity-50"
          >
            + Add debt
          </button>
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
          <div className="ml-auto grid w-full grid-cols-2 gap-3 sm:w-96">
            <NumberField label="Extra each month" value={s.extra} onChange={(v) => set('extra', v)} prefix={sym} locale={loc} min={0} decimals={0} />
            <CurrencyPicker label="Currency" value={cur} onChange={(v) => set('cur', v)} codes={CURRENCY_CODES} />
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted">Monthly budget</p>
            <p className="tabular text-2xl font-bold">{money(totalMin + s.extra)}</p>
            <p className="text-xs text-muted">
              {money(totalMin)} in minimums + {money(s.extra)} extra, towards {money(totalBal)} of debt. When a debt is cleared, its payment rolls on to the next.
            </p>
          </div>
          <ShareButton />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <PlanCard title="Avalanche" subtitle="Highest interest rate first" r={aval} best={aval.paysOff && saving > 0.5} money={money} />
          <PlanCard title="Snowball" subtitle="Smallest balance first" r={snow} best={false} money={money} />
        </div>
        {saving > 0.5 && (
          <p className="mt-4 text-sm">
            The avalanche method saves <strong>{money(saving)}</strong> in interest. The snowball method clears your first debt sooner, which some people find more motivating.
          </p>
        )}
        {aval.paysOff && snow.paysOff && saving <= 0.5 && <p className="mt-4 text-sm">Both methods cost the same here, so pick the one that keeps you motivated.</p>}
      </div>
    </section>
  );
}
