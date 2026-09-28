import { splitByItems } from '@/lib/calculators/costs';
import { tip } from '@/lib/calculators/shopping';
import { CURRENCY_CODES, currencySymbol, formatMoney, localeFor } from '@/lib/format/number';
import { useUrlState } from '@/lib/hooks/useUrlState';
import { InlineNumber, NumberField, QuickPicks, Tabs } from '@/components/ui/fields';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { Headline, ShareButton, StatGrid } from './shared/results';

const DEFAULTS = { mode: 'even', bill: 186.4, tip: 15, people: 4, round: 'no', subs: '42.5,38,55.9,31', shared: 18, tax: 8, cur: 'USD' };
const MAX_PEOPLE = 20;

export default function SplitBillCalculator() {
  const [s, set, reset] = useUrlState(DEFAULTS);
  const mode = s.mode === 'items' ? 'items' : 'even';
  const cur = s.cur;
  const money = (v: number) => formatMoney(v, cur, 2);
  const subs = s.subs
    .split(',')
    .filter((x) => x !== '')
    .slice(0, MAX_PEOPLE)
    .map((x) => Number(x) || 0);

  const even = tip({ bill: s.bill, tipPct: s.tip, people: s.people, rounding: s.round === 'yes' ? 'person' : 'none' });
  const byItems = splitByItems(
    subs.map((subtotal) => ({ subtotal })),
    Math.max(0, s.shared),
    Math.max(0, s.tax),
    Math.max(0, s.tip),
  );
  const setSub = (i: number, v: number) => set('subs', subs.map((x, j) => (j === i ? v : x)).join(','));
  const moneyField = { prefix: currencySymbol(cur), locale: localeFor(cur), min: 0, decimals: 2 };

  return (
    <section aria-label="Split bill calculator" className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-r lg:border-b-0">
          <Tabs
            value={mode}
            onChange={(v) => set('mode', v)}
            tabs={[
              { value: 'even', label: 'Split evenly' },
              { value: 'items', label: 'By what each ordered' },
            ]}
          />
          {mode === 'even' ? (
            <>
              <NumberField label="Bill total" value={s.bill} onChange={(v) => set('bill', v)} {...moneyField} hint="Including any tax already on the bill." />
              <NumberField label="Number of people" value={s.people} onChange={(v) => set('people', v)} min={1} max={100} decimals={0} />
            </>
          ) : (
            <>
              <div>
                <p className="mb-1.5 text-sm font-medium">Each person’s items (before tax and tip)</p>
                <ol className="space-y-2">
                  {subs.map((v, i) => (
                    <li key={i} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2rem] items-center gap-2">
                      <span className="text-sm font-medium">Person {i + 1}</span>
                      <InlineNumber label={`Person ${i + 1} items`} value={v} onChange={(x) => setSub(i, x)} width="w-full" allowNegative={false} />
                      {subs.length > 1 ? (
                        <button type="button" aria-label={`Remove person ${i + 1}`} onClick={() => set('subs', subs.filter((_, j) => j !== i).join(','))} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                          ✕
                        </button>
                      ) : (
                        <span />
                      )}
                    </li>
                  ))}
                </ol>
                <button type="button" disabled={subs.length >= MAX_PEOPLE} onClick={() => set('subs', [...subs, 0].join(','))} className="mt-3 h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-brand/40 disabled:opacity-50">
                  + Add person
                </button>
              </div>
              <NumberField label="Shared items (split evenly)" value={s.shared} onChange={(v) => set('shared', v)} {...moneyField} hint="Starters, drinks for the table, delivery fees." />
              <NumberField label="Tax" value={s.tax} onChange={(v) => set('tax', v)} suffix="%" min={0} max={50} decimals={3} hint="Set to 0 if prices already include tax." />
            </>
          )}
          <div>
            <NumberField label="Tip" value={s.tip} onChange={(v) => set('tip', v)} suffix="%" min={0} max={100} decimals={1} />
            <div className="mt-2">
              <QuickPicks label="Common tips" values={[0, 10, 15, 18, 20]} value={s.tip} onPick={(v) => set('tip', v)} />
            </div>
          </div>
          <CurrencyPicker label="Currency" value={cur} onChange={(v) => set('cur', v)} codes={CURRENCY_CODES} />
          {mode === 'even' && (
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" checked={s.round === 'yes'} onChange={(e) => set('round', e.target.checked ? 'yes' : 'no')} className="size-4 accent-[var(--brand)]" />
              Round each share up to a whole amount
            </label>
          )}
          <button type="button" onClick={reset} className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:text-fg">
            Reset
          </button>
        </div>
        <div className="bg-surface-2/50 p-5 sm:p-7" aria-live="polite">
          {mode === 'even' ? (
            <>
              <Headline label={`Each of ${Math.max(1, Math.round(s.people))} pays`} value={money(even.totalPerPerson)} action={<ShareButton />} />
              <div className="mt-6">
                <StatGrid
                  items={[
                    ['Bill', money(s.bill)],
                    [`Tip (${even.effectivePct.toFixed(1)}%)`, money(even.tip)],
                    ['Total with tip', money(even.total)],
                    ['Tip per person', money(even.tipPerPerson)],
                  ]}
                />
              </div>
              {s.round === 'yes' && <p className="mt-3 text-xs text-muted">Rounding up adds a little to the tip, so the effective tip is slightly higher than you set.</p>}
            </>
          ) : (
            <>
              <Headline label="Bill total with tax and tip" value={money(byItems.total)} action={<ShareButton />} />
              <p className="mt-2 text-sm text-muted">
                Items {money(byItems.itemsTotal)} · tax {money(byItems.tax)} · tip {money(byItems.tip)}
              </p>
              <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
                <table className="tabular w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Person</th>
                      <th className="px-4 py-2.5 text-right font-medium">Items</th>
                      <th className="px-4 py-2.5 text-right font-medium">Tax + tip</th>
                      <th className="px-4 py-2.5 text-right font-medium">Pays</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {byItems.each.map((p, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5">Person {i + 1}</td>
                        <td className="px-4 py-2.5 text-right">{money(p.base)}</td>
                        <td className="px-4 py-2.5 text-right text-muted">{money(p.tax + p.tip)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{money(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">Items include an equal share of the {money(Math.max(0, s.shared))} of shared items. Tax and tip are split in proportion to what each person had.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
