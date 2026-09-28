// Placeholder brand. Change the name here and it updates everywhere:
// header, footer, page titles, structured data and Open Graph tags.
export const SITE = {
  name: 'All-in-One Calculator',
  tagline: 'Free, fast calculators with clear explanations',
  description:
    'Free online calculators for finance, health, math, conversions, dates and more. Instant results, step-by-step explanations and shareable links.',
  locale: 'en',
  twitter: '',
  /** Default byline for blog posts; a post can override it with `author:` in its frontmatter. */
  author: 'Editorial Team',
  /** Placeholder until the domain is bought: shown on the contact, privacy and terms pages. */
  email: 'hello@example.com',
  /** "Last updated" date shown on the privacy, terms and disclaimer pages. */
  legalUpdated: '2026-09-28',
} as const;

export const ADSENSE_CLIENT = import.meta.env.PUBLIC_ADSENSE_CLIENT ?? '';
