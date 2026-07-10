import { describe, it, expect } from 'vitest';
import { newsSchema, productSchema } from '../src/content-schemas.ts';

describe('newsSchema', () => {
  it('akzeptiert einen gültigen News-Frontmatter und coerct das Datum', () => {
    const parsed = newsSchema.parse({
      title: 'Test', date: '2025-11-15', lang: 'de',
      slug: 'test', wp_id: 1, trid: 2, translation: 'x.md',
    });
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.lang).toBe('de');
  });

  it('lehnt eine unbekannte Sprache ab', () => {
    expect(() => newsSchema.parse({ title: 'x', date: '2025-01-01', lang: 'fr', slug: 's' }))
      .toThrow();
  });

  it('akzeptiert translation: null (reale DE-Daten)', () => {
    const parsed = newsSchema.parse({ title: 'x', date: '2025-01-01', lang: 'de', slug: 's', translation: null });
    expect(parsed.translation).toBeNull();
  });

  it('akzeptiert ein optionales image-Feld', () => {
    const parsed = newsSchema.parse({
      title: 'x', date: '2025-01-01', lang: 'de', slug: 's',
      image: '/assets/uploads/2023/06/foo.jpg',
    });
    expect(parsed.image).toBe('/assets/uploads/2023/06/foo.jpg');
  });
});

describe('productSchema', () => {
  it('setzt order auf 0 per Default', () => {
    const p = productSchema.parse({ title: 'veo', lang: 'de', slug: 'veo', teaser: 't' });
    expect(p.order).toBe(0);
  });
});
