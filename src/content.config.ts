import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { newsSchema, productSchema, pageSchema } from './content-schemas.ts';
import { entryToId } from './collection-id.ts';

const news = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/news',
    generateId: ({ entry }) => entryToId(entry),
  }),
  schema: newsSchema,
});
const products = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/products',
    generateId: ({ entry }) => entryToId(entry),
  }),
  schema: productSchema,
});
const pages = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/pages',
    generateId: ({ entry }) => entryToId(entry),
  }),
  schema: pageSchema,
});

export const collections = { news, products, pages };
