import type { Lang } from '../i18n/ui.ts';

export interface NewsLikeEntry {
  id: string; // z.B. "de/2025-11-15-moldplas"
  data: { lang: Lang; date: Date; title: string; translation?: string | null };
}

export function newsByLang<T extends NewsLikeEntry>(entries: readonly T[], lang: Lang): T[] {
  return entries
    .filter((e) => e.data.lang === lang)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function newsSlug(id: string): string {
  return id.slice(id.indexOf('/') + 1);
}

export function newsPath(entry: NewsLikeEntry): string {
  const prefix = entry.data.lang === 'en' ? '/en' : '/de';
  return `${prefix}/news/${newsSlug(entry.id)}/`;
}

/** Pfad des Sprach-Gegenstücks (via translation-Dateiname); Fallback: News-Übersicht. */
export function counterpartPath(entry: NewsLikeEntry, all: readonly NewsLikeEntry[]): string {
  const otherLang: Lang = entry.data.lang === 'de' ? 'en' : 'de';
  const fallback = otherLang === 'en' ? '/en/news/' : '/de/news/';
  const file = entry.data.translation;
  if (!file) return fallback;
  const otherId = `${otherLang}/${file.replace(/\.mdx?$/, '')}`;
  const other = all.find((e) => e.id === otherId);
  return other ? newsPath(other) : fallback;
}
