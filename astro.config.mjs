// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * The public address of the site. Canonical URLs, the sitemap and Open
 * Graph tags are all built from it. In order of preference:
 * 1. SITE_URL (set this to the real domain when it's live)
 * 2. on Vercel, the project's production address (VERCEL_PROJECT_PRODUCTION_URL)
 * 3. a placeholder for local builds
 * A bare hostname ("my-site.vercel.app") gets https:// added, a blank value
 * is ignored, and anything that still isn't a valid http(s) URL stops the
 * build with a clear message instead of Astro's bare "Invalid URL".
 */
function siteUrl() {
  const candidates = [
    ['SITE_URL', process.env.SITE_URL],
    ['VERCEL_PROJECT_PRODUCTION_URL', process.env.VERCEL_PROJECT_PRODUCTION_URL],
  ];
  for (const [name, raw] of candidates) {
    const value = (raw ?? '').trim().replace(/^["']|["']$/g, '');
    if (!value) continue;
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(withScheme);
      if (url.hostname.includes('.') || url.hostname === 'localhost') return url.origin;
    } catch {
      // Reported below.
    }
    throw new Error(`${name} must be a web address like https://example.com, but it is "${raw}".`);
  }
  return 'https://example.com';
}
const SITE_URL = siteUrl();

// Only `astro dev` uses the dev Vite cache; build, check and preview get a
// separate one. Sharing a cache lets a production run overwrite the dev
// server's pre-bundled React with the production copy, which breaks every
// interactive widget in dev ("_jsxDEV is not a function").
//
// The dev cache is `.vite-dev`, not Vite's default `.vite`: browsers keep
// pre-bundled files for a year (immutable caching), so a browser that once
// received a broken copy under /node_modules/.vite/ would keep reusing it.
// A new folder name gives every file a new URL.
const isDev = process.argv.includes('dev');

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    cacheDir: isDev ? 'node_modules/.vite-dev' : 'node_modules/.vite-build',
  },
});
