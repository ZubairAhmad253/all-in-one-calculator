// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Replace with the real domain before going live. Canonical URLs,
// the sitemap and Open Graph tags are all built from this value.
const SITE_URL = process.env.SITE_URL ?? 'https://example.com';

// `astro build` and `astro check` get their own Vite cache. Sharing the
// default one with a running `astro dev` lets a build overwrite the dev
// server's pre-bundled React with the production copy, which breaks every
// interactive widget in dev ("_jsxDEV is not a function").
const isBuild = process.argv.some((arg) => arg === 'build' || arg === 'check');

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    cacheDir: isBuild ? 'node_modules/.vite-build' : 'node_modules/.vite',
  },
});
