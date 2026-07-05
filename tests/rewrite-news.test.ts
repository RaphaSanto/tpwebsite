// tests/rewrite-news.test.ts
import { describe, it, expect } from 'vitest';
import { rewriteNews } from '../scripts/lib/rewrite-news.mjs';

const sample = `---
title: "Test"
date: 2024-01-18
lang: de
slug: "test"
wp_id: 1
trid: 2
translation: "test.md"
---
Ein Bild ![alt](http://teraport.de/wp-content/uploads/2024/01/foo.jpg) im Text.
Mehr auf [Kontakt](https://teraport.de/kontakt).
`;

describe('rewriteNews', () => {
  it('schreibt wp-content-Bild-URLs auf lokale /assets/uploads-Pfade um', () => {
    const { body } = rewriteNews(sample);
    expect(body).toContain('/assets/uploads/2024/01/foo.jpg');
    expect(body).not.toContain('teraport.de/wp-content');
  });

  it('macht teraport.de-Links relativ', () => {
    const { body } = rewriteNews(sample);
    expect(body).toContain('](/kontakt)');
    expect(body).not.toContain('https://teraport.de/kontakt');
  });

  it('behält den Frontmatter unverändert bei', () => {
    const { frontmatter } = rewriteNews(sample);
    expect(frontmatter.slug).toBe('test');
    expect(frontmatter.trid).toBe(2);
  });
});
