import { useEffect, useState } from 'react';
import type { IsoDate } from '@/lib/calculators/dates';

/** Today's date in the visitor's own time zone, as YYYY-MM-DD. */
export function localToday(): IsoDate {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * "Today" is only known in the browser, not when the page is built, so this
 * is null during the server render and fills in straight after load.
 */
export function useToday(): IsoDate | null {
  const [today, setToday] = useState<IsoDate | null>(null);
  useEffect(() => setToday(localToday()), []);
  return today;
}
