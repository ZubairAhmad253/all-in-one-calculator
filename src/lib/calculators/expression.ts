/**
 * Safe arithmetic expression evaluator for the basic and scientific
 * calculators. A small recursive-descent parser, so user input is never
 * run as JavaScript (no eval / Function).
 *
 * Grammar, lowest to highest precedence:
 *   expr    := term (('+' | '-') term)*
 *   term    := unary (('*' | '/') unary | implicit-multiply unary)*
 *   unary   := ('-' | '+') unary | power
 *   power   := postfix ('^' unary)?          right-associative; -2^2 = -4
 *   postfix := primary ('!' | '%')*
 *   primary := number | constant | function '(' expr ')' | '(' expr ')'
 *
 * Percent works like a phone calculator: `200 + 10%` = 220 and
 * `200 - 10%` = 180 (a percentage of the left side); elsewhere x% = x/100.
 * Unclosed brackets at the end are closed automatically: `sin(30` works.
 */

export type AngleMode = 'deg' | 'rad';

export class CalcError extends Error {}

interface Options {
  angle?: AngleMode;
  /** Value of the `ans` keyword (previous answer). */
  ans?: number;
}

type Token =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string };

/** Map display symbols to the parser's ASCII operators. */
export function normalize(input: string): string {
  return input
    .replace(/[×✕]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/∛/g, 'cbrt')
    .replace(/,/g, '');
}

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ') {
      i++;
      continue;
    }
    const num = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/.exec(src.slice(i));
    if (num) {
      tokens.push({ t: 'num', v: Number(num[0]) });
      i += num[0].length;
      continue;
    }
    // Lowercase only: a capital E is reserved for scientific notation, so
    // "2E" (EXP pressed, exponent not typed yet) is incomplete, not 2 × e.
    if (src[i] === 'E') throw new CalcError('Enter the exponent after E');
    const id = /^[a-z]+/.exec(src.slice(i));
    if (id) {
      tokens.push({ t: 'id', v: id[0] });
      i += id[0].length;
      continue;
    }
    if ('+-*/^!%()'.includes(c)) {
      tokens.push({ t: 'op', v: c });
      i++;
      continue;
    }
    throw new CalcError(`Unexpected “${c}”`);
  }
  return tokens;
}

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };
const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'ln', 'log', 'sqrt', 'cbrt', 'abs', 'exp']);

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new CalcError('Factorial needs a whole number ≥ 0');
  if (n > 170) throw new CalcError('Number too large');
  let r = 1;
  for (let k = 2; k <= n; k++) r *= k;
  return r;
}

interface Value {
  v: number;
  /** True when the value came from a trailing `%`, for `a + b%` handling. */
  pct: boolean;
}

export function evaluate(input: string, { angle = 'deg', ans = 0 }: Options = {}): number {
  const tokens = tokenize(normalize(input));
  if (tokens.length === 0) throw new CalcError('Empty expression');
  let pos = 0;

  const peek = () => tokens[pos];
  const isOp = (v: string) => peek()?.t === 'op' && peek()!.v === v;
  const toRad = (x: number) => (angle === 'deg' ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (angle === 'deg' ? (x * 180) / Math.PI : x);

  function expr(): Value {
    let left = term();
    while (isOp('+') || isOp('-')) {
      const op = tokens[pos++].v;
      const right = term();
      const r = right.pct ? (left.v * right.v) : right.v;
      left = { v: op === '+' ? left.v + r : left.v - r, pct: false };
    }
    return left;
  }

  function term(): Value {
    let left = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = tokens[pos++].v;
        const right = unary();
        if (op === '/' && right.v === 0) throw new CalcError('Can’t divide by zero');
        left = { v: op === '*' ? left.v * right.v : left.v / right.v, pct: false };
      } else if (peek() && (peek()!.t === 'num' || peek()!.t === 'id' || isOp('('))) {
        // Implicit multiplication: 2π, 3(4), (1+2)(3+4), 2sin(30).
        left = { v: left.v * unary().v, pct: false };
      } else return left;
    }
  }

  function unary(): Value {
    if (isOp('-')) {
      pos++;
      const x = unary();
      return { v: -x.v, pct: x.pct };
    }
    if (isOp('+')) {
      pos++;
      return unary();
    }
    return power();
  }

  function power(): Value {
    const base = postfix();
    if (isOp('^')) {
      pos++;
      const exp = unary();
      const v = Math.pow(base.v, exp.v);
      if (Number.isNaN(v)) throw new CalcError('Not a real number');
      return { v, pct: false };
    }
    return base;
  }

  function postfix(): Value {
    let x = primary();
    while (isOp('!') || isOp('%')) {
      const op = tokens[pos++].v;
      x = op === '!' ? { v: factorial(x.v), pct: false } : { v: x.v / 100, pct: true };
    }
    return x;
  }

  function group(): number {
    const v = expr().v;
    if (isOp(')')) pos++;
    else if (pos < tokens.length) throw new CalcError('Missing “)”');
    // At the end of input a missing “)” is closed automatically.
    return v;
  }

  function primary(): Value {
    const tok = tokens[pos++];
    if (!tok) throw new CalcError('Incomplete expression');
    if (tok.t === 'num') return { v: tok.v, pct: false };
    if (tok.t === 'op' && tok.v === '(') return { v: group(), pct: false };
    if (tok.t === 'id') {
      if (tok.v === 'ans') return { v: ans, pct: false };
      if (tok.v in CONSTANTS) return { v: CONSTANTS[tok.v], pct: false };
      if (FUNCTIONS.has(tok.v)) {
        if (!isOp('(')) throw new CalcError(`Use brackets: ${tok.v}(…)`);
        pos++;
        return { v: applyFn(tok.v, group()), pct: false };
      }
      throw new CalcError(`Unknown “${tok.v}”`);
    }
    throw new CalcError(`Unexpected “${tok.v}”`);
  }

  function applyFn(name: string, x: number): number {
    switch (name) {
      case 'sin':
        return exactTrig(x, 'sin');
      case 'cos':
        return exactTrig(x, 'cos');
      case 'tan':
        return exactTrig(x, 'tan');
      case 'asin':
      case 'acos':
        if (x < -1 || x > 1) throw new CalcError('Input must be between −1 and 1');
        return fromRad(name === 'asin' ? Math.asin(x) : Math.acos(x));
      case 'atan':
        return fromRad(Math.atan(x));
      case 'sinh':
        return Math.sinh(x);
      case 'cosh':
        return Math.cosh(x);
      case 'tanh':
        return Math.tanh(x);
      case 'ln':
      case 'log':
        if (x <= 0) throw new CalcError('Logarithm needs a number > 0');
        return name === 'ln' ? Math.log(x) : Math.log10(x);
      case 'sqrt':
        if (x < 0) throw new CalcError('Not a real number');
        return Math.sqrt(x);
      case 'cbrt':
        return Math.cbrt(x);
      case 'abs':
        return Math.abs(x);
      case 'exp':
        return Math.exp(x);
    }
    throw new CalcError(`Unknown “${name}”`);
  }

  /** In degrees, return exact values at multiples of 90° (sin 180 = 0, tan 90 undefined). */
  function exactTrig(x: number, fn: 'sin' | 'cos' | 'tan'): number {
    if (angle === 'deg' && Number.isInteger(x / 90)) {
      const q = (((x / 90) % 4) + 4) % 4; // quarter turns, 0–3
      const sin = [0, 1, 0, -1][q];
      const cos = [1, 0, -1, 0][q];
      if (fn === 'sin') return sin;
      if (fn === 'cos') return cos;
      if (cos === 0) throw new CalcError('Undefined (tan of 90°)');
      return sin / cos + 0; // + 0 turns −0 into 0
    }
    const r = toRad(x);
    const v = fn === 'sin' ? Math.sin(r) : fn === 'cos' ? Math.cos(r) : Math.tan(r);
    // sin(π) is 1.2e-16 in floating point; calculators show 0.
    return Math.abs(v) < 1e-15 ? 0 : v;
  }

  const result = expr();
  if (pos < tokens.length) throw new CalcError(`Unexpected “${(tokens[pos] as { v: string | number }).v}”`);
  if (!Number.isFinite(result.v)) throw new CalcError('Number too large');
  return result.v;
}

/**
 * Tidy a result for display: 12 significant digits removes floating-point
 * noise (0.1 + 0.2 → 0.3), with scientific notation for very large or
 * very small numbers.
 */
export function formatResult(v: number): string {
  if (!Number.isFinite(v)) return 'Error';
  const clean = Number(v.toPrecision(12));
  if (clean === 0) return '0';
  const abs = Math.abs(clean);
  if (abs >= 1e15 || abs < 1e-9) {
    const [m, e] = clean.toExponential(9).split('e');
    return `${m.replace(/\.?0+$/, '')}E${e.replace('+', '')}`;
  }
  return clean.toLocaleString('en', { maximumFractionDigits: 10 });
}
