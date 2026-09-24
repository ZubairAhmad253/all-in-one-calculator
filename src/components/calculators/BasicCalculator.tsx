import { BasicKeys, Display, History, useCalculator, useKeyboard } from './shared/keypad';

export default function BasicCalculator() {
  const calc = useCalculator();
  useKeyboard(calc);

  return (
    <section aria-label="Basic calculator" className="card grid gap-6 p-4 sm:p-6 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:justify-center">
      <div className="space-y-4">
        <Display calc={calc} />
        <BasicKeys calc={calc} />
        <p className="hidden text-center text-xs text-muted sm:block">
          Keyboard: numbers, + − * /, % , Enter for =, Backspace, Esc to clear
        </p>
      </div>
      <aside className="border-t border-line pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-6">
        <History calc={calc} />
      </aside>
    </section>
  );
}
