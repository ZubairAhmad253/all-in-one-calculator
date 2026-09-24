import { useState } from 'react';
import type { AngleMode } from '@/lib/calculators/expression';
import { BasicKeys, Display, History, Key, useCalculator, useKeyboard } from './shared/keypad';

export default function ScientificCalculator() {
  const [angle, setAngle] = useState<AngleMode>('deg');
  const [second, setSecond] = useState(false);
  const calc = useCalculator(angle);

  useKeyboard(calc, (e) => {
    const map: Record<string, () => void> = {
      s: () => calc.input('sin('),
      c: () => calc.input('cos('),
      t: () => calc.input('tan('),
      l: () => calc.input('log('),
      n: () => calc.input('ln('),
      r: () => calc.input('√('),
      p: () => calc.input('π'),
      e: () => calc.input('e'),
    };
    const fn = map[e.key];
    fn?.();
    return !!fn;
  });

  /** Insert, then drop back from the 2nd layer like a real calculator. */
  const fn = (text: string, kind?: 'value' | 'postfix' | 'operator') => {
    calc.input(text, kind);
    setSecond(false);
  };

  const trig = (name: 'sin' | 'cos' | 'tan') => (
    <Key tone="fn" onClick={() => fn(second ? `a${name}(` : `${name}(`)} label={second ? `Inverse ${name}` : name}>
      {second ? (
        <span>
          {name}
          <sup>−1</sup>
        </span>
      ) : (
        name
      )}
    </Key>
  );

  return (
    <section aria-label="Scientific calculator" className="card grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="space-y-4">
        <Display calc={calc} badge={angle === 'deg' ? 'DEG' : 'RAD'} />

        <div className="grid gap-3 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:gap-5">
          <div className="grid grid-cols-5 gap-2 sm:gap-3 md:grid-cols-4">
            <Key tone="muted" onClick={() => setAngle((a) => (a === 'deg' ? 'rad' : 'deg'))} label={`Angle mode: ${angle === 'deg' ? 'degrees' : 'radians'}. Switch`}>
              <span className="text-sm font-semibold">{angle === 'deg' ? 'Deg' : 'Rad'}</span>
            </Key>
            <Key tone="muted" onClick={() => setSecond((s) => !s)} active={second} label="Second functions">
              <span className="text-sm font-semibold">2nd</span>
            </Key>
            <Key tone="fn" onClick={() => calc.input('(')} label="Open bracket">
              (
            </Key>
            <Key tone="fn" onClick={() => calc.input(')', 'postfix')} label="Close bracket">
              )
            </Key>

            {trig('sin')}
            {trig('cos')}
            {trig('tan')}
            <Key tone="fn" onClick={() => fn('π')} label="Pi">
              π
            </Key>

            <Key tone="fn" onClick={() => fn(second ? 'e^(' : 'ln(')} label={second ? 'e to the power' : 'Natural log'}>
              {second ? (
                <span>
                  e<sup>x</sup>
                </span>
              ) : (
                'ln'
              )}
            </Key>
            <Key tone="fn" onClick={() => fn(second ? '10^(' : 'log(')} label={second ? '10 to the power' : 'Log base 10'}>
              {second ? (
                <span>
                  10<sup>x</sup>
                </span>
              ) : (
                'log'
              )}
            </Key>
            <Key tone="fn" onClick={() => fn(second ? '∛(' : '√(')} label={second ? 'Cube root' : 'Square root'}>
              {second ? '∛' : '√'}
            </Key>
            <Key tone="fn" onClick={() => fn('e')} label="Euler's number">
              e
            </Key>

            <Key tone="fn" onClick={() => fn(second ? '^3' : '^2', 'postfix')} label={second ? 'Cube' : 'Square'}>
              <span>
                x<sup>{second ? 3 : 2}</sup>
              </span>
            </Key>
            <Key tone="fn" onClick={() => fn('^', 'operator')} label="Power">
              <span>
                x<sup>y</sup>
              </span>
            </Key>
            <Key tone="fn" onClick={() => fn('!', 'postfix')} label="Factorial">
              n!
            </Key>
            <Key tone="fn" onClick={() => fn('^(−1)', 'postfix')} label="Reciprocal">
              1/x
            </Key>

            <Key tone="fn" onClick={() => !calc.isAfterOperator && /\d$/.test(calc.expr) && fn('E')} label="Times ten to the power (EXP)">
              <span className="text-sm font-semibold">EXP</span>
            </Key>
            <Key tone="fn" onClick={() => fn('ans')} label="Previous answer">
              <span className="text-sm font-semibold">Ans</span>
            </Key>
            <Key tone="fn" onClick={() => fn('abs(')} label="Absolute value">
              |x|
            </Key>
            <Key tone="fn" onClick={() => fn('exp(')} label="Exponential (e to the power)">
              <span className="text-sm font-semibold">exp</span>
            </Key>
          </div>

          <BasicKeys calc={calc} />
        </div>
      </div>

      <aside className="border-t border-line pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
        <History calc={calc} />
        <div className="mt-6 hidden text-xs text-muted lg:block">
          <p className="font-semibold text-fg">Keyboard shortcuts</p>
          <p className="mt-1">Numbers and + − * / ^ ( ) % !</p>
          <p>s, c, t: sin, cos, tan · l: log · n: ln</p>
          <p>r: √ · p: π · e: e · Enter: = · Esc: clear</p>
        </div>
      </aside>
    </section>
  );
}
