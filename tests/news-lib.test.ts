import { describe, it, expect } from 'vitest';
import { newsByLang, newsSlug, newsPath, counterpartPath } from '../src/lib/news.ts';

type E = Parameters<typeof newsByLang>[0][number];
const mk = (id: string, lang: 'de' | 'en', date: string, translation?: string | null): E =>
  ({ id, data: { lang, date: new Date(date), title: id, translation } }) as E;

const de1 = mk('de/2025-11-15-moldplas.md'.replace('.md', ''), 'de', '2025-11-15', '2025-11-15-moldplas.md');
const de2 = mk('de/2023-06-20-mido.md'.replace('.md', ''), 'de', '2023-06-20', null);
const en1 = mk('en/2025-11-15-moldplas.md'.replace('.md', ''), 'en', '2025-11-15', '2025-11-15-moldplas.md');
const all = [de2, en1, de1];

describe('newsByLang', () => {
  it('filtert nach Sprache und sortiert absteigend nach Datum', () => {
    const r = newsByLang(all, 'de');
    expect(r.map((e) => e.id)).toEqual(['de/2025-11-15-moldplas', 'de/2023-06-20-mido']);
  });
});

describe('newsSlug / newsPath', () => {
  it('leitet Slug und Pfad aus der sprach-qualifizierten ID ab', () => {
    expect(newsSlug(de1.id)).toBe('2025-11-15-moldplas');
    expect(newsPath(de1)).toBe('/news/2025-11-15-moldplas/');
    expect(newsPath(en1)).toBe('/en/news/2025-11-15-moldplas/');
  });
});

describe('counterpartPath', () => {
  it('findet das Gegenstück über den translation-Dateinamen', () => {
    expect(counterpartPath(de1, all)).toBe('/en/news/2025-11-15-moldplas/');
    expect(counterpartPath(en1, all)).toBe('/news/2025-11-15-moldplas/');
  });
  it('fällt ohne Gegenstück auf die News-Übersicht der anderen Sprache zurück', () => {
    expect(counterpartPath(de2, all)).toBe('/en/news/');
  });
});
