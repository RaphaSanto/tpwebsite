import { describe, it, expect } from 'vitest';
import { entryToId } from '../src/collection-id.ts';

describe('entryToId', () => {
  it('erzeugt für gleiche Dateinamen in de/ und en/ unterschiedliche IDs', () => {
    const de = entryToId('de/2023-10-05-teraport-tritt-der-altair-partner-alliance-bei.md');
    const en = entryToId('en/2023-10-05-teraport-tritt-der-altair-partner-alliance-bei.md');
    expect(de).not.toBe(en);
    expect(de).toBe('de/2023-10-05-teraport-tritt-der-altair-partner-alliance-bei');
  });
  it('entfernt die .md/.mdx-Endung', () => {
    expect(entryToId('en/foo.mdx')).toBe('en/foo');
  });
});
