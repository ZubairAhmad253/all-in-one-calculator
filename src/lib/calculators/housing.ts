/**
 * Home-buying maths beyond the mortgage itself. Pure functions only.
 */
import { monthlyPayment } from './loan';

export interface DownPaymentInput {
  price: number;
  /** Down payment as a percentage of the price. */
  downPct: number;
  /** Closing costs as a percentage of the price (typically 2–5%). */
  closingPct: number;
  savings: number;
  monthlySaving: number;
  /** Interest earned on savings, % a year. */
  savingsRate: number;
  /** Mortgage rate, % a year, for the payment estimate. */
  mortgageRate: number;
  termYears: number;
}

export interface DownPaymentResult {
  downPayment: number;
  closingCosts: number;
  /** Down payment + closing costs. */
  cashNeeded: number;
  shortfall: number;
  /** Months of saving to cover the shortfall; Infinity if it's never reached. */
  monthsToSave: number;
  loan: number;
  payment: number;
  /** Below 20% down, most conventional loans add mortgage insurance. */
  pmiLikely: boolean;
}

export function downPayment(i: DownPaymentInput): DownPaymentResult {
  const price = Math.max(i.price, 0);
  const down = (price * Math.min(Math.max(i.downPct, 0), 100)) / 100;
  const closing = (price * Math.max(i.closingPct, 0)) / 100;
  const cashNeeded = down + closing;
  const shortfall = Math.max(cashNeeded - Math.max(i.savings, 0), 0);

  let monthsToSave = 0;
  if (shortfall > 0) {
    const r = Math.max(i.savingsRate, 0) / 100 / 12;
    let bal = Math.max(i.savings, 0);
    const save = Math.max(i.monthlySaving, 0);
    while (bal < cashNeeded && monthsToSave < 1200) {
      bal = bal * (1 + r) + save;
      monthsToSave++;
    }
    if (bal < cashNeeded) monthsToSave = Infinity;
  }

  const loan = price - down;
  return {
    downPayment: down,
    closingCosts: closing,
    cashNeeded,
    shortfall,
    monthsToSave,
    loan,
    payment: monthlyPayment(loan, i.mortgageRate, Math.round(i.termYears * 12)),
    pmiLikely: i.downPct < 20,
  };
}

// ---------------------------------------------------------- rent vs buy

export interface RentVsBuyInput {
  price: number;
  downPct: number;
  mortgageRate: number;
  termYears: number;
  /** Buying costs as % of price (paid upfront). */
  buyCostPct: number;
  /** Selling costs as % of the sale price (agent, legal). */
  sellCostPct: number;
  /** Property tax, % of home value a year. */
  propertyTaxPct: number;
  /** Maintenance, % of home value a year. */
  maintenancePct: number;
  /** Home insurance, a year. */
  insurance: number;
  /** Home price growth, % a year. */
  homeGrowth: number;
  rent: number;
  /** Rent increase, % a year. */
  rentGrowth: number;
  /** Return on money invested instead (deposit, and any monthly difference), % a year. */
  investReturn: number;
  years: number;
}

export interface RentVsBuyYear {
  year: number;
  /** Home equity after selling costs, plus the buyer's investments. */
  buyWorth: number;
  /** The renter's investments. */
  rentWorth: number;
  rentPaid: number;
  ownPaid: number;
}

export interface RentVsBuyResult {
  years: RentVsBuyYear[];
  /** First year when buying leaves you better off; null if never within the period. */
  breakEvenYear: number | null;
  /** Buyer net worth minus renter net worth at the end (positive = buying wins). */
  advantage: number;
  upfront: number;
  payment: number;
}

/**
 * Compare net worth, not just costs. Both start with the same cash: the
 * buyer spends it on the deposit and buying costs, the renter invests it.
 * Each month, whoever has the lower housing cost invests the difference.
 */
export function rentVsBuy(i: RentVsBuyInput): RentVsBuyResult {
  const down = (i.price * i.downPct) / 100;
  const upfront = down + (i.price * i.buyCostPct) / 100;
  const loan = i.price - down;
  const n = Math.round(i.termYears * 12);
  const payment = monthlyPayment(loan, i.mortgageRate, n);
  const rm = i.mortgageRate / 100 / 12;
  const inv = Math.pow(1 + i.investReturn / 100, 1 / 12) - 1;
  const hg = Math.pow(1 + i.homeGrowth / 100, 1 / 12) - 1;

  let balance = loan;
  let home = i.price;
  let rent = i.rent;
  let renterPot = upfront;
  let buyerPot = 0;
  let rentPaid = 0;
  let ownPaid = upfront;
  const years: RentVsBuyYear[] = [];

  for (let m = 1; m <= Math.round(i.years * 12); m++) {
    const mortgage = balance > 0.005 ? Math.min(payment, balance * (1 + rm)) : 0;
    if (balance > 0.005) balance = balance * (1 + rm) - mortgage;
    const ownCost = mortgage + (home * (i.propertyTaxPct + i.maintenancePct)) / 100 / 12 + i.insurance / 12;

    renterPot *= 1 + inv;
    buyerPot *= 1 + inv;
    if (ownCost > rent) renterPot += ownCost - rent;
    else buyerPot += rent - ownCost;

    rentPaid += rent;
    ownPaid += ownCost;
    home *= 1 + hg;
    if (m % 12 === 0) {
      years.push({
        year: m / 12,
        buyWorth: home * (1 - i.sellCostPct / 100) - Math.max(balance, 0) + buyerPot,
        rentWorth: renterPot,
        rentPaid,
        ownPaid,
      });
      rent *= 1 + i.rentGrowth / 100;
    }
  }

  const be = years.find((y) => y.buyWorth >= y.rentWorth);
  const last = years.at(-1);
  return { years, breakEvenYear: be ? be.year : null, advantage: last ? last.buyWorth - last.rentWorth : 0, upfront, payment };
}
