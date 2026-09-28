// Change the name here and it updates everywhere: header, footer, page
// titles, structured data and Open Graph tags.
export const SITE = {
  /** This site's name: the calculator site in the Kitwise family. */
  name: 'Kitwise Calc',
  /** The family brand shared with future Kitwise sites (resume builder, file converter). */
  brand: 'Kitwise',
  tagline: 'Free calculators with clear, step-by-step answers',
  description:
    'Kitwise Calc: free online calculators for money, health, maths, conversions, dates and more. Instant results, step-by-step explanations and shareable links.',
  /** Default image for link previews (1200 × 630). */
  ogImage: '/og-image.jpg',
  /** Square logo for search engines (structured data). */
  logo: '/icon-512.png',
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
