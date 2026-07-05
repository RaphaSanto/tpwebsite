import { z } from 'zod';

const lang = z.enum(['de', 'en']);

export const newsSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  lang,
  slug: z.string(),
  wp_id: z.number().optional(),
  trid: z.number().optional(),
  translation: z.string().nullable().optional(),
});

export const productSchema = z.object({
  title: z.string(),
  lang,
  slug: z.string(),
  order: z.number().default(0),
  teaser: z.string(),
});

export const pageSchema = z.object({
  title: z.string(),
  lang,
  slug: z.string(),
});
