import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { newsSchema } from './content-schemas.ts';
import { entryToId } from './collection-id.ts';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news', generateId: ({ entry }) => entryToId(entry) }),
  schema: newsSchema,
});

export const collections = { news };
