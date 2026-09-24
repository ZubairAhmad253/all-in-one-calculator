import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CalcError, evaluate, formatResult, type AngleMode } from '@/lib/calculators/expression';

export interface HistoryItem {
  expr: string;
  result: string;
  value: number;
}

/** A number as expression text the parser accepts (no commas, E notation). */
const toExpr = (v: number) => String(Number(v.toPrecision(12))).replace('e+', 'E').replace('e-', 'E-');

const OPERATOR_END = /[+−×÷^(E]$/;

/**
 * State and actions for a keypad calculator: the expression being typed,
 * a live preview of its value, the previous answer and a short history.
 */
export function useCalculator(angle: AngleMode = 'deg') {
  const [expr, setExpr] = useState('');
  const [ans, setAns] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** True right after "=", so typing a digit starts a new calculation. */
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const preview = useMemo(() => {
    if (!expr || done) return '';
    try {
      return formatResult(evaluate(expr, { angle, ans }));
    } catch {
      return '';
    }
  }, [expr, angle, ans, done]);

  /** Insert text; `kind` decides how it combines with a finished result. */
  const input = useCallback(
    (text: string, kind: 'value' | 'operator' | 'postfix' = 'value') => {
      setError(null);
      setExpr((e) => {
        if (done) return kind === 'value' ? text : toExpr(ans) + text;
        if (kind === 'operator' && e === '' && text !== '−') return toExpr(ans) + text;
        // Replace a trailing operator rather than stacking two (5 + × → 5 ×).
        if (kind === 'operator' && text !== '−' && /[+−×÷]$/.test(e)) return e.slice(0, -1) + text;
        return e + text;
      });
      setDone(false);
    },
    [done, ans],
  );

  const clear = useCallback(() => {
    setExpr('');
    setError(null);
    setDone(false);
  }, []);

  const backspace = useCallback(() => {
    setError(null);
    if (done) return clear();
    // Delete whole function names like "sin(" in one go.
    setExpr((e) => e.replace(/(asin|acos|atan|sin|cos|tan|ln|log|√|∛|abs|ans)\($|ans$|.$/, ''));
  }, [done, clear]);

  /** ± : negate the last number, or the result after "=". */
  const negate = useCallback(() => {
    setError(null);
    if (done) {
      setExpr(toExpr(-ans));
      setAns(-ans);
      return;
    }
    setExpr((e) => {
      const wrapped = /\(−([\d.E]+)\)$/.exec(e);
      if (wrapped) return e.slice(0, -wrapped[0].length) + wrapped[1];
      const num = /([\d.]+(?:E−?\d+)?)$/.exec(e);
      if (num) return e.slice(0, -num[1].length) + `(−${num[1]})`;
      return e + '(−';
    });
  }, [done, ans]);

  const equals = useCallback(() => {
    if (!expr || done) return;
    try {
      const value = evaluate(expr, { angle, ans });
      const result = formatResult(value);
      setAns(value);
      setHistory((h) => [{ expr, result, value }, ...h].slice(0, 10));
      setDone(true);
      setError(null);
    } catch (err) {
      setError(err instanceof CalcError ? err.message : 'Error');
    }
  }, [expr, done, angle, ans]);

  const recall = useCallback((item: HistoryItem) => {
    setExpr(toExpr(item.value));
    setAns(item.value);
    setDone(false);
    setError(null);
  }, []);

  return { expr, preview, ans, error, done, history, input, clear, backspace, negate, equals, recall, isAfterOperator: OPERATOR_END.test(expr) };
}

export type Calculator = ReturnType<typeof useCalculator>;

/**
 * Keyboard support. Listens on the whole page but ignores keystrokes aimed
 * at other inputs (like the site search box).
 */
export function useKeyboard(calc: Calculator, extra?: (e: KeyboardEvent) => boolean) {
  const ref = useRef(calc);
  ref.current = calc;
  const extraRef = useRef(extra);
  extraRef.current = extra;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest('input, textarea, select, dialog, [contenteditable="true"]')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const c = ref.current;
      const k = e.key;
      let handled = true;
      if (/^[0-9.]$/.test(k)) c.input(k);
      else if (k === '+') c.input('+', 'operator');
      else if (k === '-') c.input('−', 'operator');
      else if (k === '*' || k === 'x') c.input('×', 'operator');
      else if (k === '/') c.input('÷', 'operator');
      else if (k === '^') c.input('^', 'operator');
      else if (k === '%') c.input('%', 'postfix');
      else if (k === '!') c.input('!', 'postfix');
      else if (k === '(') c.input('(');
      else if (k === ')') c.input(')', 'postfix');
      else if (k === 'Enter' || k === '=') c.equals();
      else if (k === 'Backspace') c.backspace();
      else if (k === 'Escape' || k === 'Delete') c.clear();
      else handled = extraRef.current?.(e) ?? false;
      if (handled) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/** Expression line, live preview or final answer, and any error. */
export function Display({ calc, badge }: { calc: Calculator; badge?: ReactNode }) {
  const main = calc.done ? formatResult(calc.ans) : calc.expr || '0';
  return (
    <div className="rounded-2xl bg-surface-2 px-5 py-4 text-right" aria-live="polite">
      <div className="flex min-h-5 items-center justify-between gap-3 text-sm text-muted">
        <span className="text-xs font-semibold tracking-wide uppercase">{badge}</span>
        <span className="tabular truncate" title={calc.done ? calc.expr : undefined}>
          {calc.done ? `${calc.expr} =` : calc.preview && calc.preview !== calc.expr ? `= ${calc.preview}` : ''}
        </span>
      </div>
      <output
        className={`tabular mt-1 block overflow-x-auto font-semibold tracking-tight whitespace-nowrap ${main.length > 16 ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'}`}
        aria-label={calc.done ? `Result ${main}` : `Expression ${main}`}
      >
        {main}
      </output>
      <p className="mt-1 min-h-5 text-sm text-warn" role="alert">
        {calc.error}
      </p>
    </div>
  );
}

type KeyTone = 'num' | 'op' | 'fn' | 'eq' | 'muted';

const TONES: Record<KeyTone, string> = {
  num: 'bg-surface text-fg border-line hover:bg-surface-2',
  op: 'bg-brand-soft text-brand border-transparent hover:brightness-95',
  fn: 'bg-surface-2 text-fg border-transparent hover:brightness-95',
  eq: 'bg-brand text-brand-fg border-transparent hover:opacity-90',
  muted: 'bg-surface-2 text-muted border-transparent hover:text-fg',
};

export function Key({ children, onClick, tone = 'num', label, active, className = '' }: {
  children: ReactNode;
  onClick: () => void;
  tone?: KeyTone;
  /** Accessible name when the key shows a symbol. */
  label?: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`tabular flex h-14 items-center justify-center rounded-xl border text-lg font-medium transition select-none active:scale-[0.97] sm:h-16 ${TONES[tone]} ${active ? 'ring-2 ring-brand' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

/** Standard 4 × 5 keypad shared by both calculators. */
export function BasicKeys({ calc }: { calc: Calculator }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      <Key tone="muted" onClick={calc.clear} label="Clear">
        AC
      </Key>
      <Key tone="muted" onClick={calc.backspace} label="Backspace">
        ⌫
      </Key>
      <Key tone="op" onClick={() => calc.input('%', 'postfix')} label="Percent">
        %
      </Key>
      <Key tone="op" onClick={() => calc.input('÷', 'operator')} label="Divide">
        ÷
      </Key>
      {['7', '8', '9'].map((d) => (
        <Key key={d} onClick={() => calc.input(d)}>
          {d}
        </Key>
      ))}
      <Key tone="op" onClick={() => calc.input('×', 'operator')} label="Multiply">
        ×
      </Key>
      {['4', '5', '6'].map((d) => (
        <Key key={d} onClick={() => calc.input(d)}>
          {d}
        </Key>
      ))}
      <Key tone="op" onClick={() => calc.input('−', 'operator')} label="Subtract">
        −
      </Key>
      {['1', '2', '3'].map((d) => (
        <Key key={d} onClick={() => calc.input(d)}>
          {d}
        </Key>
      ))}
      <Key tone="op" onClick={() => calc.input('+', 'operator')} label="Add">
        +
      </Key>
      <Key onClick={calc.negate} label="Change sign">
        ±
      </Key>
      <Key onClick={() => calc.input('0')}>0</Key>
      <Key onClick={() => calc.input('.')} label="Decimal point">
        .
      </Key>
      <Key tone="eq" onClick={calc.equals} label="Equals">
        =
      </Key>
    </div>
  );
}

/** Recent answers; tap one to reuse it. */
export function History({ calc }: { calc: Calculator }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">History</h2>
      {calc.history.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Your recent calculations will appear here.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {calc.history.map((h, i) => (
            <li key={i}>
              <button type="button" onClick={() => calc.recall(h)} className="tabular w-full rounded-lg px-2 py-1.5 text-right hover:bg-surface-2">
                <span className="block truncate text-xs text-muted">{h.expr} =</span>
                <span className="block truncate font-medium">{h.result}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
