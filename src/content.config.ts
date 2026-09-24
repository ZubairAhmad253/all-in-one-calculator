import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from '@/data/categories';

const categoryIds = CATEGORIES.map((c) => c.id) as [string, ...string[]];

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(70),
    /** Meta description: aim for 120–160 characters. */
    description: z.string().min(50).max(170),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Editorial Team'),
    category: z.enum(categoryIds),
    /** Slugs of calculators this post supports; drives cross-linking both ways. */
    calculators: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
