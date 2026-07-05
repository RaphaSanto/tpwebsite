import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { newsSchema, productSchema, pageSchema } from './content-schemas.ts';

const news = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/news',
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: newsSchema,
});
const products = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/products',
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: productSchema,
});
const pages = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/pages',
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: pageSchema,
});

export const collections = { news, products, pages };
