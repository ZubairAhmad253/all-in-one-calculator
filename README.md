# All-in-One Calculator

A fast, SEO-focused website of free online calculators (finance, math, health, conversions, dates, education and everyday life), with a blog of guides that link to them.

> **"All-in-One Calculator" is a placeholder name.** Change it in [`src/config/site.ts`](src/config/site.ts) and it updates everywhere.

**Status:** foundation built. **8 of 111** planned calculators are live: [mortgage](src/pages/mortgage-calculator.astro), [loan](src/pages/loan-calculator.astro), [EMI](src/pages/emi-calculator.astro), [compound interest](src/pages/compound-interest-calculator.astro), [SIP](src/pages/sip-calculator.astro), [sales tax / VAT](src/pages/sales-tax-calculator.astro), [discount](src/pages/discount-calculator.astro) and [tip](src/pages/tip-calculator.astro). See [Roadmap](#roadmap).

## Features

- **Instant results.** Calculators update as you type. There is no "Calculate" button.
- **Shareable results.** Inputs are saved in the URL (`/mortgage-calculator?price=500000&rate=6`).
- **Charts and schedules.** Built in SVG, with no chart library.
- **15 currencies,** for a global audience.
- **Light and dark mode,** following the system setting, with a manual toggle.
- **Search every calculator** with <kbd>Ctrl</kbd>+<kbd>K</kbd>.
- **Built-in SEO:**
  - static HTML
  - canonical URLs and a sitemap
  - structured data (`WebApplication`, `FAQPage`, `BreadcrumbList`, `Article`, `CollectionPage`)
  - Open Graph tags
  - automatic internal links between calculators and blog posts
- **Ad-ready.** Fixed-height ad slots mean ads never shift the page as it loads (good for Core Web Vitals).
- **Accessible:** labelled inputs, keyboard navigation, visible focus, a skip link and live result announcements.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Astro 7](https://astro.build) | Sends plain HTML and loads JavaScript only for the calculator widget, which makes pages fast and good for SEO |
| Interactive widgets | React 19 (Astro islands) | Calculators hydrate on the client; the rest of the page stays static |
| Language | TypeScript (strict) | |
| Styling | Tailwind CSS 4 + CSS design tokens | One set of tokens handles light and dark mode |
| Blog | MDX via Astro content collections | Posts are type-checked and can embed components |
| Tests | Vitest | Checks calculator formulas against known results |
| Font | Inter (self-hosted via Fontsource) | No third-party font requests |

## Getting started

Requires **Node.js 20+** (developed on Node 24).

```bash
npm install
npm run dev        # http://localhost:4321
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check (`astro check`) and build the static site into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the formula unit tests |
| `npm run test:watch` | Run tests in watch mode |

> TypeScript is pinned to v6 because `astro check` does not support TypeScript 7 yet.

### Environment variables

Copy `.env.example` to `.env`:

| Variable | Purpose |
|---|---|
| `SITE_URL` | Production URL, used for canonical links, the sitemap and `robots.txt`. Defaults to `https://example.com`. |
| `PUBLIC_ADSENSE_CLIENT` | AdSense publisher ID (`ca-pub-…`). Leave it empty to show labelled "Ad space" placeholders. |

## Project structure

```
src/
├── config/site.ts              Site name, tagline, AdSense ID
├── data/
│   ├── calculators.ts          Master list of all 111 calculators (live + planned)
│   └── categories.ts           The 7 categories
├── lib/
│   ├── calculators/            Formula logic only: no UI, fully unit-tested
│   │   ├── mortgage.ts
│   │   └── mortgage.test.ts
│   ├── format/number.ts        Currency/number formatting, input parsing
│   └── hooks/useUrlState.ts    State that syncs to the URL for sharing
├── components/
│   ├── calculators/            One React widget per calculator
│   ├── charts/                 Donut and LineChart (SVG)
│   ├── ui/                     Form fields, cards, icons
│   └── layout/                 Header, footer, search, ads, FAQ, breadcrumbs
├── layouts/
│   ├── BaseLayout.astro        <head>, SEO tags, JSON-LD, theme, header/footer
│   └── CalculatorLayout.astro  Shared shell for every calculator page
├── content/blog/               Blog posts (.mdx)
├── content.config.ts           Blog frontmatter schema
├── pages/                      File-based routes
│   ├── <slug>.astro            One page per calculator, e.g. mortgage-calculator.astro
│   ├── category/[category].astro
│   ├── blog/
│   └── robots.txt.ts
└── styles/global.css           Design tokens, light/dark themes, prose styles
```

## Adding a calculator

Each calculator is built in four parts. Use the mortgage calculator as the reference for each one.

1. **Formula:** create `src/lib/calculators/<name>.ts` with pure functions. Put no formatting or DOM code in it.
2. **Tests:** create `src/lib/calculators/<name>.test.ts`. Check the results against a trusted source such as a textbook example or a bank's calculator, and cover edge cases like zero, empty input and very large values. Run `npm test`.
3. **Widget:** create `src/components/calculators/<Name>Calculator.tsx`. Use:
   - `useUrlState` for inputs, so results can be shared
   - `NumberField` / `SelectField` / `Tabs` from `components/ui/fields.tsx`
   - the `format/number.ts` helpers for output
4. **Page:** create `src/pages/<slug>.astro`, where `<slug>` matches the entry in `src/data/calculators.ts`. Wrap it in `CalculatorLayout` and provide:
   - `title`: about 60 characters, containing the main search phrase
   - `description`: 120–160 characters
   - `intro`: one sentence
   - `faqs`: 4–6 real questions people search for
   - a `learn` slot: how to use it, the formula, a worked example, and background
5. **Go live:** add the slug to the `LIVE` set in `src/data/calculators.ts`. It then shows up in search, category pages, related links and the sitemap.

**Writing guidelines for calculator pages:**
- Put the calculator first and the explanation below it.
- Show sensible default values so a first-time visitor sees a result straight away.
- Explain the result in words, not just a number.
- Write the worked example with the same default numbers the calculator shows.

## Writing a blog post

Create `src/content/blog/<slug>.mdx`:

```mdx
---
title: How Much House Can I Afford? A Simple Guide   # ≤ 70 chars
description: A 120–160 character summary for search results.
pubDate: 2026-09-24
updatedDate: 2026-10-01          # optional
category: finance                # a category id from data/categories.ts
calculators: [mortgage-calculator]
draft: false
---

Your content. Use ## for sections: they become the table of contents.
```

The `calculators` field links the post both ways. The post shows a "Try the calculator" card, and the calculator page lists the post under "Guides". The build fails if the frontmatter doesn't match the schema in `src/content.config.ts`.

## Design system

All colours are CSS variables in `src/styles/global.css`, exposed to Tailwind as `bg-surface`, `text-muted`, `border-line`, `text-brand`, `chart-1…4` and so on. Dark mode swaps only the variable values, so components never need `dark:` classes for colour. To change the brand colour, edit `--brand` (and its dark-mode value) in one place.

Shared classes:
- `.card`: panel surface
- `.container-page`: page width and side gutters
- `.prose-content`: long-form text
- `.formula`: highlighted formula block
- `.tabular`: aligned numbers

## Ads

`AdSlot` (`src/components/layout/AdSlot.astro`) reserves a fixed height. Current placements on calculator pages:
- a 728×90 slot below the calculator
- a 300×600 slot in the sidebar (desktop only)

The AdSense script and live ad units load only when `PUBLIC_ADSENSE_CLIENT` is set and a slot ID is passed (`<AdSlot slot="1234567890" />`).

Before applying to AdSense:
- have enough useful content live (roughly 20–30 good calculator pages and some blog posts)
- publish the privacy policy
- serve EU/UK visitors a Google-certified consent banner

## Deployment

The build output in `dist/` is a fully static site. Pages are built as `name.html` and served at clean URLs (`/mortgage-calculator`), which Cloudflare Pages, Vercel and Netlify all do by default.

**Cloudflare Pages** or **Vercel**:
- build command: `npm run build`
- output directory: `dist`
- set `SITE_URL` (and `PUBLIC_ADSENSE_CLIENT` when you have it) as environment variables

## Roadmap

The full list of 111 calculators, with categories and phases, is in [`src/data/calculators.ts`](src/data/calculators.ts).

| Category | Planned |
|---|---|
| Finance | 31 |
| Math | 25 |
| Health & Fitness | 15 |
| Conversion | 15 |
| Everyday & Home | 12 |
| Date & Time | 8 |
| Education | 5 |

- **Phase 1:** the 25 calculators with the highest search demand (marked `phase: 1`), such as loan, EMI, BMI, percentage, age and GPA.
- **Phase 2:** the rest of the list.
- **After that:** add calculators based on Search Console data.

## Pre-launch checklist

- [ ] Pick a name and domain; update `src/config/site.ts` and `SITE_URL`
- [ ] Replace the favicon and add a default Open Graph image (1200×630), passed as `image` to `BaseLayout`
- [ ] Review the privacy policy (`src/pages/privacy.astro`) and add contact details to the About page
- [ ] Build the Phase 1 calculators
- [ ] Deploy, then submit `sitemap-index.xml` in Google Search Console
- [ ] Apply for AdSense and set up a consent banner for EU/UK visitors

## Disclaimer

Calculator results are estimates for information only and are not financial, medical, tax or legal advice.
