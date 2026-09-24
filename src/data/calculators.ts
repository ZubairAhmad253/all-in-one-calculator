import type { CategoryId } from './categories';

/**
 * The master list of calculators. Every calculator the site will offer
 * lives here, whether it is built yet or not.
 *
 * - `live`    has a page at /<slug> and is linked from menus, search and the sitemap.
 * - `planned` is shown as "coming soon" on category pages and is never linked.
 *
 * `phase` is the build order: 1 = launch set (highest search demand),
 * 2 = the rest of the first release. To ship a calculator, build its page
 * and flip `status` to `live`.
 */
export interface CalculatorEntry {
  slug: string;
  name: string;
  category: CategoryId;
  status: 'live' | 'planned';
  phase: 1 | 2;
  /** One-line summary used on cards and in search. */
  summary: string;
  /** Extra search terms that should match this calculator. */
  keywords?: string[];
}

type Row = [slug: string, name: string, phase: 1 | 2, summary: string, keywords?: string[]];

const LIVE = new Set(['mortgage-calculator']);

const group = (category: CategoryId, rows: Row[]): CalculatorEntry[] =>
  rows.map(([slug, name, phase, summary, keywords]) => ({
    slug,
    name,
    category,
    phase,
    summary,
    keywords,
    status: LIVE.has(slug) ? 'live' : 'planned',
  }));

export const CALCULATORS: CalculatorEntry[] = [
  ...group('finance', [
    ['mortgage-calculator', 'Mortgage Calculator', 1, 'Monthly payment, total interest and amortization schedule for a home loan.', ['home loan', 'house', 'amortization', 'pmi']],
    ['loan-calculator', 'Loan Calculator', 1, 'Payment and total cost for any fixed-rate loan.', ['personal loan']],
    ['emi-calculator', 'EMI Calculator', 1, 'Equated monthly instalment for home, car or personal loans.', ['instalment', 'installment']],
    ['amortization-calculator', 'Amortization Calculator', 2, 'Full payment-by-payment breakdown of principal and interest.'],
    ['auto-loan-calculator', 'Auto Loan Calculator', 2, 'Monthly car payment including trade-in, down payment and fees.', ['car loan']],
    ['compound-interest-calculator', 'Compound Interest Calculator', 1, 'Growth of savings with compounding and regular contributions.'],
    ['simple-interest-calculator', 'Simple Interest Calculator', 2, 'Interest on a principal at a flat rate.'],
    ['sip-calculator', 'SIP Calculator', 1, 'Future value of a systematic investment plan.', ['mutual fund']],
    ['fixed-deposit-calculator', 'Fixed Deposit Calculator', 2, 'Maturity value of fixed and recurring deposits.', ['fd', 'rd', 'recurring deposit']],
    ['savings-calculator', 'Savings Calculator', 2, 'How long until you reach a savings goal.'],
    ['investment-calculator', 'Investment Calculator', 2, 'Projected investment value and return on investment.', ['roi']],
    ['retirement-calculator', 'Retirement Calculator', 2, 'How much you need to save to retire comfortably.', ['pension']],
    ['inflation-calculator', 'Inflation Calculator', 2, 'The future or past value of money after inflation.'],
    ['salary-calculator', 'Salary Calculator', 2, 'Convert between hourly, monthly and annual pay.', ['take home', 'wage']],
    ['sales-tax-calculator', 'Sales Tax / VAT Calculator', 1, 'Add or remove sales tax or VAT from a price.', ['vat']],
    ['gst-calculator', 'GST Calculator', 2, 'Add or remove GST from an amount.'],
    ['discount-calculator', 'Discount Calculator', 1, 'Sale price and savings after a percentage discount.', ['sale', 'percent off']],
    ['tip-calculator', 'Tip Calculator', 1, 'Tip amount and per-person split.', ['gratuity']],
    ['currency-converter', 'Currency Converter', 1, 'Convert between world currencies at current rates.', ['exchange rate', 'fx']],
    ['credit-card-payoff-calculator', 'Credit Card Payoff Calculator', 2, 'Time and interest to pay off a credit card balance.'],
    ['debt-payoff-calculator', 'Debt Payoff Calculator', 2, 'Snowball vs avalanche payoff plans for multiple debts.', ['snowball', 'avalanche']],
    ['apr-calculator', 'APR Calculator', 2, 'True annual cost of a loan including fees.'],
    ['down-payment-calculator', 'Down Payment Calculator', 2, 'How much house you can buy with a given down payment.'],
    ['rent-vs-buy-calculator', 'Rent vs Buy Calculator', 2, 'Compare the long-term cost of renting and buying.'],
    ['profit-margin-calculator', 'Profit Margin Calculator', 2, 'Gross and net margin from cost and revenue.'],
    ['markup-calculator', 'Markup Calculator', 2, 'Selling price from cost and markup percentage.'],
    ['break-even-calculator', 'Break-Even Calculator', 2, 'Units you need to sell to cover your costs.'],
    ['depreciation-calculator', 'Depreciation Calculator', 2, 'Straight-line and declining-balance depreciation.'],
    ['npv-calculator', 'NPV Calculator', 2, 'Net present value of a series of cash flows.'],
    ['irr-calculator', 'IRR Calculator', 2, 'Internal rate of return of a series of cash flows.'],
    ['cagr-calculator', 'CAGR Calculator', 2, 'Compound annual growth rate between two values.'],
  ]),
  ...group('math', [
    ['basic-calculator', 'Basic Calculator', 1, 'A simple calculator for everyday arithmetic.'],
    ['scientific-calculator', 'Scientific Calculator', 1, 'Trigonometry, logarithms, powers and more.'],
    ['fraction-calculator', 'Fraction Calculator', 1, 'Add, subtract, multiply and divide fractions.'],
    ['percentage-calculator', 'Percentage Calculator', 1, 'Percent of, percentage change and percentage difference.', ['percent']],
    ['ratio-calculator', 'Ratio Calculator', 2, 'Simplify and scale ratios.'],
    ['average-calculator', 'Average Calculator', 2, 'Mean, median, mode and range of a list of numbers.', ['mean', 'median', 'mode']],
    ['standard-deviation-calculator', 'Standard Deviation Calculator', 2, 'Sample and population standard deviation and variance.'],
    ['quadratic-equation-solver', 'Quadratic Equation Solver', 2, 'Roots of ax² + bx + c = 0 with working.'],
    ['lcm-gcd-calculator', 'LCM & GCD Calculator', 2, 'Least common multiple and greatest common divisor.', ['hcf', 'gcf']],
    ['prime-number-checker', 'Prime Number Checker', 2, 'Check whether a number is prime and list its factors.'],
    ['factorial-calculator', 'Factorial Calculator', 2, 'n! for large whole numbers.'],
    ['exponent-calculator', 'Exponent Calculator', 2, 'Raise a number to any power.', ['power']],
    ['logarithm-calculator', 'Logarithm Calculator', 2, 'Logarithms in any base.', ['log', 'ln']],
    ['square-root-calculator', 'Square Root Calculator', 2, 'Square, cube and nth roots.'],
    ['rounding-calculator', 'Rounding Calculator', 2, 'Round to decimal places or significant figures.'],
    ['scientific-notation-calculator', 'Scientific Notation Calculator', 2, 'Convert to and from scientific notation.'],
    ['matrix-calculator', 'Matrix Calculator', 2, 'Matrix addition, multiplication, determinant and inverse.'],
    ['probability-calculator', 'Probability Calculator', 2, 'Probability of single and combined events.'],
    ['permutation-combination-calculator', 'Permutation & Combination Calculator', 2, 'nPr and nCr with explanations.', ['npr', 'ncr']],
    ['pythagorean-theorem-calculator', 'Pythagorean Theorem Calculator', 2, 'Find the missing side of a right triangle.'],
    ['triangle-calculator', 'Triangle Calculator', 2, 'Sides, angles, area and perimeter of any triangle.'],
    ['circle-calculator', 'Circle Calculator', 2, 'Area, circumference, radius and diameter.'],
    ['area-calculator', 'Area Calculator', 2, 'Area of common 2D shapes.'],
    ['volume-calculator', 'Volume Calculator', 2, 'Volume of common 3D shapes.'],
    ['slope-calculator', 'Slope Calculator', 2, 'Slope, distance and line equation between two points.'],
  ]),
  ...group('health', [
    ['bmi-calculator', 'BMI Calculator', 1, 'Body mass index for adults and children, metric or imperial.', ['body mass index']],
    ['bmr-calculator', 'BMR Calculator', 2, 'Calories your body burns at rest.'],
    ['calorie-calculator', 'Calorie Calculator', 1, 'Daily calories to maintain, lose or gain weight.', ['tdee']],
    ['body-fat-calculator', 'Body Fat Calculator', 2, 'Body fat percentage using the US Navy method.'],
    ['ideal-weight-calculator', 'Ideal Weight Calculator', 2, 'Healthy weight range for your height.'],
    ['macro-calculator', 'Macro Calculator', 2, 'Daily protein, carbs and fat targets.'],
    ['protein-calculator', 'Protein Calculator', 2, 'How much protein you need per day.'],
    ['water-intake-calculator', 'Water Intake Calculator', 2, 'Recommended daily water intake.'],
    ['pregnancy-due-date-calculator', 'Pregnancy Due Date Calculator', 1, 'Estimated due date and pregnancy week.'],
    ['ovulation-calculator', 'Ovulation Calculator', 2, 'Fertile window and ovulation date.'],
    ['pace-calculator', 'Running Pace Calculator', 2, 'Pace, time and distance for runs and races.'],
    ['heart-rate-zone-calculator', 'Heart Rate Zone Calculator', 2, 'Training zones from max and resting heart rate.'],
    ['one-rep-max-calculator', 'One Rep Max Calculator', 2, 'Estimate your 1RM from any set.'],
    ['sleep-calculator', 'Sleep Calculator', 2, 'Best times to sleep and wake based on sleep cycles.'],
    ['waist-to-hip-ratio-calculator', 'Waist-to-Hip Ratio Calculator', 2, 'Waist-to-hip ratio and what it means.'],
  ]),
  ...group('conversion', [
    ['length-converter', 'Length Converter', 1, 'Convert metres, feet, inches, miles and more.'],
    ['weight-converter', 'Weight Converter', 1, 'Convert kilograms, pounds, ounces and stone.', ['mass']],
    ['temperature-converter', 'Temperature Converter', 1, 'Convert Celsius, Fahrenheit and Kelvin.'],
    ['area-converter', 'Area Converter', 2, 'Convert square metres, acres, hectares and more.'],
    ['volume-converter', 'Volume Converter', 2, 'Convert litres, gallons, cups and more.'],
    ['speed-converter', 'Speed Converter', 2, 'Convert km/h, mph, knots and m/s.'],
    ['time-converter', 'Time Converter', 2, 'Convert seconds, minutes, hours, days and years.'],
    ['data-storage-converter', 'Data Storage Converter', 2, 'Convert bytes, KB, MB, GB and TB.'],
    ['pressure-converter', 'Pressure Converter', 2, 'Convert bar, psi, pascal and atm.'],
    ['energy-converter', 'Energy Converter', 2, 'Convert joules, calories, kWh and BTU.'],
    ['fuel-economy-converter', 'Fuel Economy Converter', 2, 'Convert mpg and L/100 km.'],
    ['cooking-converter', 'Cooking Measurement Converter', 2, 'Convert cups, tablespoons, grams and millilitres.'],
    ['number-base-converter', 'Number Base Converter', 2, 'Convert binary, octal, decimal and hexadecimal.', ['binary', 'hex']],
    ['roman-numeral-converter', 'Roman Numeral Converter', 2, 'Convert numbers to and from Roman numerals.'],
    ['time-zone-converter', 'Time Zone Converter', 2, 'Convert times between world time zones.'],
  ]),
  ...group('date-time', [
    ['age-calculator', 'Age Calculator', 1, 'Exact age in years, months and days.', ['birthday']],
    ['date-difference-calculator', 'Date Difference Calculator', 1, 'Days, weeks and months between two dates.', ['days between dates']],
    ['add-days-calculator', 'Add / Subtract Days Calculator', 2, 'The date a number of days before or after another date.'],
    ['countdown-calculator', 'Countdown Calculator', 2, 'Time remaining until an event.', ['days until']],
    ['time-duration-calculator', 'Time Duration Calculator', 2, 'Hours and minutes between two times.'],
    ['working-days-calculator', 'Working Days Calculator', 2, 'Business days between two dates.', ['business days']],
    ['hours-calculator', 'Hours Worked Calculator', 1, 'Total hours worked across shifts.'],
    ['time-card-calculator', 'Time Card Calculator', 2, 'Weekly timesheet with breaks and overtime.', ['timesheet']],
  ]),
  ...group('education', [
    ['gpa-calculator', 'GPA Calculator', 1, 'Semester and cumulative grade point average.'],
    ['cgpa-calculator', 'CGPA Calculator', 2, 'Cumulative GPA and CGPA-to-percentage conversion.'],
    ['grade-calculator', 'Grade Calculator', 1, 'Weighted course grade from assignments and exams.'],
    ['marks-percentage-calculator', 'Marks Percentage Calculator', 2, 'Percentage from marks obtained and total marks.'],
    ['final-grade-calculator', 'Final Grade Calculator', 2, 'The score you need on your final exam.'],
  ]),
  ...group('everyday', [
    ['fuel-cost-calculator', 'Fuel Cost Calculator', 2, 'Fuel cost of a trip from distance and efficiency.', ['gas', 'petrol']],
    ['electricity-bill-calculator', 'Electricity Bill Calculator', 2, 'Running cost of appliances and monthly bills.'],
    ['unit-price-calculator', 'Unit Price Calculator', 2, 'Compare prices per unit to find the best deal.'],
    ['random-number-generator', 'Random Number Generator', 1, 'Random numbers in any range.'],
    ['split-bill-calculator', 'Split Bill Calculator', 2, 'Split a bill evenly or by item.'],
    ['paint-calculator', 'Paint Calculator', 2, 'How much paint a room needs.'],
    ['tile-calculator', 'Tile Calculator', 2, 'Tiles needed for a floor or wall, with waste.'],
    ['flooring-calculator', 'Flooring Calculator', 2, 'Flooring area and cost.'],
    ['concrete-calculator', 'Concrete Calculator', 2, 'Concrete volume for slabs, footings and columns.'],
    ['brick-calculator', 'Brick Calculator', 2, 'Bricks and mortar needed for a wall.'],
    ['roofing-calculator', 'Roofing Calculator', 2, 'Roof area and shingles needed.'],
    ['wallpaper-calculator', 'Wallpaper Calculator', 2, 'Rolls of wallpaper needed for a room.'],
  ]),
];

export const liveCalculators = () => CALCULATORS.filter((c) => c.status === 'live');

export const calculatorBySlug = (slug: string) => CALCULATORS.find((c) => c.slug === slug);

export const calculatorsInCategory = (category: CategoryId) =>
  CALCULATORS.filter((c) => c.category === category);

/** Live calculators in the same category, excluding the given one. */
export const relatedCalculators = (slug: string, limit = 6) => {
  const self = calculatorBySlug(slug);
  if (!self) return [];
  return liveCalculators()
    .filter((c) => c.category === self.category && c.slug !== slug)
    .slice(0, limit);
};
