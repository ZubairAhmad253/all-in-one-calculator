// Placeholder brand. Change the name here and it updates everywhere:
// header, footer, page titles, structured data and Open Graph tags.
export const SITE = {
  name: 'All-in-One Calculator',
  tagline: 'Free, fast calculators with clear explanations',
  description:
    'Free online calculators for finance, health, math, conversions, dates and more. Instant results, step-by-step explanations and shareable links.',
  locale: 'en',
  twitter: '',
} as const;

export const ADSENSE_CLIENT = import.meta.env.PUBLIC_ADSENSE_CLIENT ?? '';
