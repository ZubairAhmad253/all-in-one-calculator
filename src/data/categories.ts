export type CategoryId =
  | 'finance'
  | 'math'
  | 'health'
  | 'conversion'
  | 'date-time'
  | 'education'
  | 'everyday';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  /** Icon name from components/ui/Icon.astro. */
  icon: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'finance',
    name: 'Finance',
    description: 'Loans, mortgages, interest, investing, tax and everyday money maths.',
    icon: 'coins',
  },
  {
    id: 'math',
    name: 'Math',
    description: 'Algebra, geometry, statistics, fractions and percentages.',
    icon: 'sigma',
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    description: 'BMI, calories, body fat, pregnancy and training calculators.',
    icon: 'heart',
  },
  {
    id: 'conversion',
    name: 'Conversion',
    description: 'Convert length, weight, temperature, data, time zones and more.',
    icon: 'arrows',
  },
  {
    id: 'date-time',
    name: 'Date & Time',
    description: 'Age, date differences, countdowns, working days and hours.',
    icon: 'calendar',
  },
  {
    id: 'education',
    name: 'Education',
    description: 'GPA, grades, marks percentage and exam score calculators.',
    icon: 'cap',
  },
  {
    id: 'everyday',
    name: 'Everyday & Home',
    description: 'Fuel, bills, shopping and home improvement estimates.',
    icon: 'home',
  },
];

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
