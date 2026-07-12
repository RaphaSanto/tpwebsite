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
  image: z.string().optional(),
});


