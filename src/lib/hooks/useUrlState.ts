import { useEffect, useRef, useState } from 'react';

type Values = Record<string, number | string>;

/**
 * Calculator state that mirrors itself into the URL query string, so any
 * result can be bookmarked or shared (?price=400000&rate=6.5).
 *
 * The server render always uses `defaults`; the URL is read after mount.
 * Only values that differ from the defaults are written, which keeps the
 * canonical page URL clean for search engines.
 */
export function useUrlState<T extends Values>(defaults: T) {
  const [state, setState] = useState<T>(defaults);
  const ready = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T & string)[]) {
      const raw = params.get(key);
      if (raw === null) continue;
      if (typeof defaults[key] === 'number') {
        const n = Number(raw);
        if (Number.isFinite(n)) (next as Values)[key] = n;
      } else (next as Values)[key] = raw;
    }
    setState(next);
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    const id = setTimeout(() => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(state)) if (v !== defaults[k]) params.set(k, String(v));
      const qs = params.toString();
      history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    }, 300);
    return () => clearTimeout(id);
  }, [state, defaults]);

  const set = <K extends keyof T>(key: K, value: T[K]) => setState((s) => ({ ...s, [key]: value }));
  const reset = () => setState(defaults);
  return [state, set, reset] as const;
}
