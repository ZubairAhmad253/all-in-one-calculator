/**
 * Kitchen conversions between volume (cups, spoons, ml) and weight (grams,
 * ounces) using typical ingredient densities. Pure functions only.
 */

const US_CUP_ML = 236.5882365;

export interface KitchenUnit {
  id: string;
  name: string;
  symbol: string;
  kind: 'volume' | 'weight';
  /** Millilitres (volume) or grams (weight) per unit. */
  size: number;
}

export const KITCHEN_UNITS: KitchenUnit[] = [
  { id: 'tsp', name: 'Teaspoons (US)', symbol: 'tsp', kind: 'volume', size: US_CUP_ML / 48 },
  { id: 'tbsp', name: 'Tablespoons (US)', symbol: 'tbsp', kind: 'volume', size: US_CUP_ML / 16 },
  { id: 'floz', name: 'Fluid ounces (US)', symbol: 'fl oz', kind: 'volume', size: US_CUP_ML / 8 },
  { id: 'cup', name: 'Cups (US)', symbol: 'cup', kind: 'volume', size: US_CUP_ML },
  { id: 'cup-metric', name: 'Cups (metric, 250 ml)', symbol: 'metric cup', kind: 'volume', size: 250 },
  { id: 'ml', name: 'Millilitres', symbol: 'ml', kind: 'volume', size: 1 },
  { id: 'l', name: 'Litres', symbol: 'L', kind: 'volume', size: 1000 },
  { id: 'g', name: 'Grams', symbol: 'g', kind: 'weight', size: 1 },
  { id: 'kg', name: 'Kilograms', symbol: 'kg', kind: 'weight', size: 1000 },
  { id: 'oz', name: 'Ounces', symbol: 'oz', kind: 'weight', size: 28.349523125 },
  { id: 'lb', name: 'Pounds', symbol: 'lb', kind: 'weight', size: 453.59237 },
];

/** Typical grams per US cup, spooned and levelled (flour) or packed where noted. */
export const INGREDIENTS = [
  { id: 'water', name: 'Water', gPerCup: 236.6 },
  { id: 'flour', name: 'All-purpose flour', gPerCup: 120 },
  { id: 'bread-flour', name: 'Bread flour', gPerCup: 127 },
  { id: 'wholewheat', name: 'Whole wheat flour', gPerCup: 113 },
  { id: 'sugar', name: 'Granulated sugar', gPerCup: 200 },
  { id: 'brown-sugar', name: 'Brown sugar (packed)', gPerCup: 213 },
  { id: 'icing-sugar', name: 'Powdered / icing sugar', gPerCup: 120 },
  { id: 'butter', name: 'Butter', gPerCup: 227 },
  { id: 'oil', name: 'Vegetable oil', gPerCup: 218 },
  { id: 'milk', name: 'Milk', gPerCup: 242 },
  { id: 'cream', name: 'Heavy cream', gPerCup: 238 },
  { id: 'yogurt', name: 'Yogurt', gPerCup: 245 },
  { id: 'honey', name: 'Honey', gPerCup: 340 },
  { id: 'maple', name: 'Maple syrup', gPerCup: 315 },
  { id: 'cocoa', name: 'Cocoa powder', gPerCup: 85 },
  { id: 'oats', name: 'Rolled oats', gPerCup: 90 },
  { id: 'rice', name: 'Rice (uncooked)', gPerCup: 185 },
  { id: 'almond-flour', name: 'Almond flour', gPerCup: 96 },
  { id: 'choc-chips', name: 'Chocolate chips', gPerCup: 170 },
  { id: 'salt', name: 'Table salt', gPerCup: 292 },
] as const;
export type IngredientId = (typeof INGREDIENTS)[number]['id'];

export const findKitchenUnit = (id: string) => KITCHEN_UNITS.find((u) => u.id === id);

/**
 * Convert an amount between kitchen units. Volume ↔ weight goes through the
 * ingredient's density; same-kind conversions ignore the ingredient.
 */
export function convertKitchen(value: number, from: string, to: string, ingredient: IngredientId): number {
  const a = findKitchenUnit(from);
  const b = findKitchenUnit(to);
  const ing = INGREDIENTS.find((i) => i.id === ingredient);
  if (!a || !b || !ing) return Number.NaN;
  const gPerMl = ing.gPerCup / US_CUP_ML;
  const amount = value * a.size; // ml or g
  if (a.kind === b.kind) return amount / b.size;
  return a.kind === 'volume' ? (amount * gPerMl) / b.size : amount / gPerMl / b.size;
}
