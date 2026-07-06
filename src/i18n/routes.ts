import type { Lang } from './ui.ts';

/** Statische Routenpaare DE ↔ EN (mit Trailing-Slash, Root = '/'). */
export const routePairs: ReadonlyArray<{ de: string; en: string }> = [
  { de: '/', en: '/en/' },
  { de: '/mido/', en: '/en/mido/' },
  { de: '/veo/', en: '/en/veo/' },
  { de: '/unternehmen/', en: '/en/company/' },
  { de: '/news/', en: '/en/news/' },
  { de: '/kontakt/', en: '/en/contact/' },
  { de: '/impressum/', en: '/en/legal-notice/' },
  { de: '/datenschutz/', en: '/en/data-privacy/' },
];

function normalize(path: string): string {
  return path.endsWith('/') ? path : path + '/';
}

export function pathLang(path: string): Lang {
  const p = normalize(path);
  return p === '/en/' || p.startsWith('/en/') ? 'en' : 'de';
}

/** Sprach-Gegenstück einer statischen Route; unbekannt → Startseite der anderen Sprache. */
export function altPath(path: string): string {
  const p = normalize(path);
  for (const pair of routePairs) {
    if (pair.de === p) return pair.en;
    if (pair.en === p) return pair.de;
  }
  return pathLang(p) === 'de' ? '/en/' : '/';
}
