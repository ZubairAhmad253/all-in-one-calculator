/**
 * Everyday running costs: fuel for a trip, electricity for appliances,
 * price per unit and splitting a bill. Pure functions only.
 */

// ------------------------------------------------------------------ fuel

export interface TripFuel {
  litres: number;
  cost: number;
  costPerKm: number;
}

/** Fuel and cost for `km` at `kmPerLitre`, paying `pricePerLitre`. */
export function tripFuel(km: number, kmPerLitre: number, pricePerLitre: number): TripFuel | null {
  if (!(km >= 0) || !(kmPerLitre > 0) || !(pricePerLitre >= 0)) return null;
  const litres = km / kmPerLitre;
  const cost = litres * pricePerLitre;
  return { litres, cost, costPerKm: km > 0 ? cost / km : 0 };
}

// ----------------------------------------------------------- electricity

export interface Appliance {
  watts: number;
  hoursPerDay: number;
  quantity: number;
}

/** Energy used per day (kWh) by one line of appliances. */
export const dailyKwh = (a: Appliance) => (Math.max(0, a.watts) * Math.max(0, a.hoursPerDay) * Math.max(0, a.quantity)) / 1000;

/** Daily, monthly (30.4 days) and yearly kWh and cost for a list of appliances. */
export function energyCost(items: Appliance[], pricePerKwh: number) {
  const day = items.reduce((sum, a) => sum + dailyKwh(a), 0);
  const DAYS_PER_MONTH = 365 / 12;
  return {
    kwh: { day, month: day * DAYS_PER_MONTH, year: day * 365 },
    cost: { day: day * pricePerKwh, month: day * DAYS_PER_MONTH * pricePerKwh, year: day * 365 * pricePerKwh },
  };
}

// ------------------------------------------------------------ unit price

/** Price per one base unit (e.g. per gram), given a package size in base units. */
export const pricePerUnit = (price: number, sizeInBase: number) => (price >= 0 && sizeInBase > 0 ? price / sizeInBase : Number.NaN);

// ------------------------------------------------------------ split bill

export interface Share {
  /** Items this person ordered, before tax and tip. */
  subtotal: number;
}

/**
 * Split a bill by what each person ordered: tax and tip are shared in
 * proportion to each subtotal, and any shared items are split evenly.
 */
export function splitByItems(people: Share[], shared: number, taxPct: number, tipPct: number) {
  const n = people.length;
  const itemsTotal = people.reduce((a, p) => a + p.subtotal, 0) + shared;
  const factor = 1 + taxPct / 100 + tipPct / 100;
  const each = people.map((p) => {
    const base = p.subtotal + (n ? shared / n : 0);
    return { base, tax: (base * taxPct) / 100, tip: (base * tipPct) / 100, total: base * factor };
  });
  return { itemsTotal, tax: (itemsTotal * taxPct) / 100, tip: (itemsTotal * tipPct) / 100, total: itemsTotal * factor, each };
}
