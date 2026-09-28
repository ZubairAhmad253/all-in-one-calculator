// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Replace with the real domain before going live. Canonical URLs,
// the sitemap and Open Graph tags are all built from this value.
const SITE_URL = process.env.SITE_URL ?? 'https://example.com';

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
