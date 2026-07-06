# Teraport Website – Plan 2: Komponenten & Seiten

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aus dem Plan-1-Fundament die sichtbare, zweisprachige Website bauen: Header/Footer, Startseite (Layout A), Produktseiten mido & veo, Unternehmen, News (Liste + Detail), Kontakt und Rechtliches — alles statisch gerendert, DE unter `/…`, EN unter `/en/…`.

**Architecture:** Astro-Komponenten (`src/components/`) + `SiteLayout` (Header/Main/Footer um das bestehende `BaseLayout`). Inhalte kommen aus den Plan-1-Collections (`news`, `pages`) plus neu angelegten `products`-Einträgen (mido/veo × de/en). Reine Logik (i18n-Routenpaare, News-Sortierung/Übersetzungs-Verknüpfung) liegt als getestete TS-Module in `src/i18n/` und `src/lib/`.

**Tech Stack:** Astro 5 (bestehend), TypeScript, Vitest (bestehend), `astro:assets` für Bilder.

## Global Constraints

- **Routen (exakt):** DE ohne Präfix, EN mit `/en`-Präfix:
  | DE | EN |
  |---|---|
  | `/` | `/en/` |
  | `/mido/` | `/en/mido/` |
  | `/veo/` | `/en/veo/` |
  | `/unternehmen/` | `/en/company/` |
  | `/news/` | `/en/news/` |
  | `/news/<slug>/` | `/en/news/<slug>/` |
  | `/kontakt/` | `/en/contact/` |
  | `/impressum/` | `/en/legal-notice/` |
  | `/datenschutz/` | `/en/data-privacy/` |
- **Produktname:** immer `mido` und `veo` (kleingeschrieben, nie „veoCAST").
- **Marke:** nur die CSS-Variablen aus `global.css` (`--tp-blue` etc.); Logo Header = `src/assets/uploads/2015/02/TP_340_trans.png`, Footer = `TP_340_trans_white.png`, via `astro:assets` `<Image>`.
- **Kontaktdaten (exakt, aus Impressum):** Teraport GmbH · Kellerstr. 29 · 81667 München · Tel. `+49 (0)89 651086 700` · E-Mail `info@teraport.de`.
- **DSGVO:** keine externen Requests/Tracker; keine Google-Fonts/-Analytics.
- **Sprachumschalter:** jede Seite verlinkt exakt ihr Gegenstück (News-Detail über die `translation`-Frontmatter; ohne Gegenstück → News-Übersicht der anderen Sprache).
- **Alte Seitentexte:** `pages`-Collection wird unverändert gerendert (redaktionelle Überarbeitung ist Auftraggeber-Aufgabe). ⚠️ Offener Punkt für Go-live (Plan 3): Impressum/Datenschutz enthalten veraltete Google-Analytics-Absätze, die auf die neue Seite nicht mehr zutreffen — dem Auftraggeber zur Prüfung vorlegen.
- **mido-Bilder:** noch keine vorhanden (offener Punkt); Produktseite kommt ohne Bild aus, Struktur bildfähig.
- **Tests/Build:** Nach jeder Task `npm run build` grün; für reine Logik-Module TDD mit Vitest. Commits Deutsch, Präfixe `feat:`/`fix:`/`test:`/`chore:`.

---

## Dateistruktur (neu in Plan 2)

```
src/
├── i18n/
│   ├── ui.ts                    # UI-Strings de/en + t()
│   └── routes.ts                # Routenpaare + altPath()
├── lib/
│   └── news.ts                  # newsByLang, newsSlug, newsPath, counterpartPath
├── components/
│   ├── Header.astro             # Logo, Nav, Sprachumschalter
│   ├── Footer.astro             # dunkel, weißes Logo, Adresse, Rechtliches
│   ├── Hero.astro               # blaue Hero-Fläche (Kicker, Headline, CTA)
│   ├── ProductTile.astro        # Produkt-Kachel (Startseite)
│   ├── BenefitsBar.astro        # Nutzen-Leiste
│   └── NewsCard.astro           # News-Karte (Titel, Datum, Link)
├── layouts/
│   └── SiteLayout.astro         # Header + <main> + Footer (nutzt BaseLayout)
├── content/products/{de,en}/    # mido.md, veo.md (NEU befüllt)
└── pages/
    ├── index.astro              # Startseite DE (ersetzt Platzhalter)
    ├── [product].astro          # /mido/, /veo/
    ├── unternehmen.astro
    ├── kontakt.astro
    ├── impressum.astro
    ├── datenschutz.astro
    ├── news/index.astro
    ├── news/[slug].astro
    └── en/  (index, [product], company, contact, legal-notice, data-privacy, news/index, news/[slug])
tests/
├── i18n-routes.test.ts
└── news-lib.test.ts
```

---

### Task 1: i18n-Modul (UI-Strings + Routenpaare)

**Files:**
- Create: `src/i18n/ui.ts`
- Create: `src/i18n/routes.ts`
- Test: `tests/i18n-routes.test.ts`

**Interfaces:**
- Consumes: nichts.
- Produces: `type Lang = 'de'|'en'`; `t(lang: Lang, key: UiKey): string`; `altPath(path: string): string` (liefert das Sprach-Gegenstück einer statischen Route; unbekannte Pfade → `'/'` bzw. `'/en/'` je nach Präfix).

- [ ] **Step 1: Failing test schreiben**

```ts
// tests/i18n-routes.test.ts
import { describe, it, expect } from 'vitest';
import { altPath } from '../src/i18n/routes.ts';
import { t } from '../src/i18n/ui.ts';

describe('altPath', () => {
  it('mappt DE-Routen auf ihr EN-Gegenstück', () => {
    expect(altPath('/')).toBe('/en/');
    expect(altPath('/unternehmen/')).toBe('/en/company/');
    expect(altPath('/impressum/')).toBe('/en/legal-notice/');
  });
  it('mappt EN-Routen zurück auf DE', () => {
    expect(altPath('/en/')).toBe('/');
    expect(altPath('/en/company/')).toBe('/unternehmen/');
    expect(altPath('/en/data-privacy/')).toBe('/datenschutz/');
  });
  it('normalisiert fehlende Trailing-Slashes', () => {
    expect(altPath('/mido')).toBe('/en/mido/');
    expect(altPath('/en/mido')).toBe('/mido/');
  });
  it('fällt bei unbekannten Pfaden auf die Startseite der anderen Sprache zurück', () => {
    expect(altPath('/gibt-es-nicht/')).toBe('/en/');
    expect(altPath('/en/does-not-exist/')).toBe('/');
  });
});

describe('t', () => {
  it('liefert Strings je Sprache', () => {
    expect(t('de', 'nav.contact')).toBe('Kontakt');
    expect(t('en', 'nav.contact')).toBe('Contact');
  });
});
```

- [ ] **Step 2: Test ausführen (erwartet FAIL: Module fehlen)**

Run: `npm test -- tests/i18n-routes.test.ts`
Expected: FAIL – `routes.ts`/`ui.ts` existieren nicht.

- [ ] **Step 3: `src/i18n/ui.ts` implementieren**

```ts
export type Lang = 'de' | 'en';

const strings = {
  de: {
    'nav.company': 'Unternehmen',
    'nav.news': 'News',
    'nav.contact': 'Kontakt',
    'footer.legal': 'Impressum',
    'footer.privacy': 'AGB / Datenschutz',
    'footer.tagline': '.software.services.excellence',
    'home.hero.kicker': 'CAD-basierte Kalkulation & 3D-Visualisierung',
    'home.hero.title': 'Präzision von der ersten CAD-Datei an.',
    'home.hero.cta': 'Kontakt aufnehmen',
    'home.products.title': 'Unsere Produkte',
    'home.news.title': 'Aktuelles',
    'home.news.all': 'Alle News',
    'benefits.1': 'CAD-basiert',
    'benefits.2': 'Regelbasiert & nachvollziehbar',
    'benefits.3': 'Praxisbewährt',
    'news.title': 'News',
    'news.back': 'Zurück zur Übersicht',
    'contact.title': 'Kontakt',
    'contact.intro': 'Sie möchten mehr über mido oder veo erfahren? Schreiben Sie uns – wir melden uns kurzfristig.',
    'contact.mail.cta': 'E-Mail schreiben',
    'product.more': 'Mehr erfahren',
  },
  en: {
    'nav.company': 'Company',
    'nav.news': 'News',
    'nav.contact': 'Contact',
    'footer.legal': 'Legal Notice',
    'footer.privacy': 'Terms / Data privacy',
    'footer.tagline': '.software.services.excellence',
    'home.hero.kicker': 'CAD-based costing & 3D visualization',
    'home.hero.title': 'Precision from the first CAD file.',
    'home.hero.cta': 'Get in touch',
    'home.products.title': 'Our products',
    'home.news.title': 'Latest news',
    'home.news.all': 'All news',
    'benefits.1': 'CAD-based',
    'benefits.2': 'Rule-based & traceable',
    'benefits.3': 'Proven in practice',
    'news.title': 'News',
    'news.back': 'Back to overview',
    'contact.title': 'Contact',
    'contact.intro': 'Want to learn more about mido or veo? Write to us – we will get back to you shortly.',
    'contact.mail.cta': 'Send an e-mail',
    'product.more': 'Learn more',
  },
} as const;

export type UiKey = keyof (typeof strings)['de'];

export function t(lang: Lang, key: UiKey): string {
  return strings[lang][key];
}
```

- [ ] **Step 4: `src/i18n/routes.ts` implementieren**

```ts
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
```

- [ ] **Step 5: Test ausführen (erwartet PASS)**

Run: `npm test -- tests/i18n-routes.test.ts`
Expected: PASS (5 Tests grün).

- [ ] **Step 6: Commit**

```bash
git add src/i18n tests/i18n-routes.test.ts
git commit -m "feat: i18n-Modul mit UI-Strings und Routenpaaren (de/en)"
```

---

### Task 2: News-Helfer (Sortierung, Slugs, Übersetzungs-Verknüpfung)

**Files:**
- Create: `src/lib/news.ts`
- Test: `tests/news-lib.test.ts`

**Interfaces:**
- Consumes: Einträge im Shape der `news`-Collection: `{ id: string; data: { lang, date: Date, title, translation?: string|null } }` (IDs sind sprach-qualifiziert: `de/<datei>`/`en/<datei>`, siehe `entryToId` aus Plan 1).
- Produces:
  - `newsByLang(entries, lang)` → gefiltert + absteigend nach Datum sortiert
  - `newsSlug(id)` → Dateiname ohne Sprachpräfix (URL-Slug)
  - `newsPath(entry)` → `/news/<slug>/` bzw. `/en/news/<slug>/`
  - `counterpartPath(entry, all)` → Pfad des Sprach-Gegenstücks via `translation`-Dateiname; Fallback News-Übersicht der anderen Sprache

- [ ] **Step 1: Failing test schreiben**

```ts
// tests/news-lib.test.ts
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
```

- [ ] **Step 2: Test ausführen (erwartet FAIL)**

Run: `npm test -- tests/news-lib.test.ts`
Expected: FAIL – `src/lib/news.ts` existiert nicht.

- [ ] **Step 3: `src/lib/news.ts` implementieren**

```ts
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
  const prefix = entry.data.lang === 'en' ? '/en' : '';
  return `${prefix}/news/${newsSlug(entry.id)}/`;
}

/** Pfad des Sprach-Gegenstücks (via translation-Dateiname); Fallback: News-Übersicht. */
export function counterpartPath(entry: NewsLikeEntry, all: readonly NewsLikeEntry[]): string {
  const otherLang: Lang = entry.data.lang === 'de' ? 'en' : 'de';
  const fallback = otherLang === 'en' ? '/en/news/' : '/news/';
  const file = entry.data.translation;
  if (!file) return fallback;
  const otherId = `${otherLang}/${file.replace(/\.mdx?$/, '')}`;
  const other = all.find((e) => e.id === otherId);
  return other ? newsPath(other) : fallback;
}
```

- [ ] **Step 4: Test ausführen (erwartet PASS)**

Run: `npm test -- tests/news-lib.test.ts`
Expected: PASS (4 Tests grün).

- [ ] **Step 5: Commit**

```bash
git add src/lib/news.ts tests/news-lib.test.ts
git commit -m "feat: News-Helfer für Sprache, Slugs und Übersetzungs-Verknüpfung"
```

---

### Task 3: Header, Footer, SiteLayout

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/layouts/SiteLayout.astro`
- Modify: `src/layouts/BaseLayout.astro` (Main-Wrapper entfernen, Slot direkt in `<body>`)
- Modify: `src/styles/global.css` (Prose-/Utility-Klassen ergänzen)

**Interfaces:**
- Consumes: `t`, `Lang` aus `src/i18n/ui.ts`; Logos aus `src/assets/uploads/2015/02/`.
- Produces: `SiteLayout` mit Props `{ title: string; lang?: Lang; description?: string; altHref?: string }` — rendert Header (mit Sprachumschalter auf `altHref`), `<main><slot/></main>`, Footer. Wenn `altHref` fehlt: `/en/` bzw. `/`.

- [ ] **Step 1: `BaseLayout.astro` anpassen (Slot direkt, kein main-Wrapper)**

```astro
---
import '../styles/global.css';
interface Props { title: string; lang?: 'de' | 'en'; description?: string; }
const { title, lang = 'de', description = '' } = Astro.props;
---
<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: `Header.astro` erstellen**

```astro
---
import { Image } from 'astro:assets';
import logo from '../assets/uploads/2015/02/TP_340_trans.png';
import { t, type Lang } from '../i18n/ui.ts';
interface Props { lang: Lang; altHref: string; }
const { lang, altHref } = Astro.props;
const p = (de: string, en: string) => (lang === 'en' ? en : de);
---
<header class="site-header">
  <div class="tp-container inner">
    <a href={p('/', '/en/')} class="brand" aria-label="Teraport – Startseite">
      <Image src={logo} alt="Teraport" height={44} densities={[1, 2]} />
    </a>
    <nav aria-label="Hauptnavigation">
      <a href={p('/mido/', '/en/mido/')}>mido</a>
      <a href={p('/veo/', '/en/veo/')}>veo</a>
      <a href={p('/unternehmen/', '/en/company/')}>{t(lang, 'nav.company')}</a>
      <a href={p('/news/', '/en/news/')}>{t(lang, 'nav.news')}</a>
      <a href={p('/kontakt/', '/en/contact/')} class="cta">{t(lang, 'nav.contact')}</a>
      <a href={altHref} class="lang" rel="alternate" hreflang={lang === 'de' ? 'en' : 'de'}>
        {lang === 'de' ? 'EN' : 'DE'}
      </a>
    </nav>
  </div>
</header>
<style>
  .site-header { background: var(--tp-white); border-bottom: 1px solid #e5e9ef; }
  .inner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-block: 0.6rem; flex-wrap: wrap; }
  .brand img { display: block; }
  nav { display: flex; align-items: center; gap: 1.1rem; flex-wrap: wrap; }
  nav a { color: var(--tp-ink); text-decoration: none; font-weight: 600; font-size: 0.95rem; }
  nav a:hover { color: var(--tp-blue); }
  nav a.cta { background: var(--tp-blue); color: var(--tp-white); padding: 0.45rem 0.9rem; border-radius: 6px; }
  nav a.cta:hover { filter: brightness(1.08); color: var(--tp-white); }
  nav a.lang { border: 1px solid var(--tp-blue-light); color: var(--tp-blue); padding: 0.3rem 0.55rem; border-radius: 6px; font-size: 0.85rem; }
</style>
```

- [ ] **Step 3: `Footer.astro` erstellen**

```astro
---
import { Image } from 'astro:assets';
import logoWhite from '../assets/uploads/2015/02/TP_340_trans_white.png';
import { t, type Lang } from '../i18n/ui.ts';
interface Props { lang: Lang; }
const { lang } = Astro.props;
const p = (de: string, en: string) => (lang === 'en' ? en : de);
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <div class="tp-container cols">
    <div>
      <Image src={logoWhite} alt="Teraport" height={40} densities={[1, 2]} />
      <p class="tagline">{t(lang, 'footer.tagline')}</p>
    </div>
    <address>
      Teraport GmbH<br />
      Kellerstr. 29<br />
      81667 München<br />
      <a href="tel:+4989651086700">+49 (0)89 651086 700</a><br />
      <a href="mailto:info@teraport.de">info@teraport.de</a>
    </address>
    <nav aria-label="Rechtliches">
      <a href={p('/impressum/', '/en/legal-notice/')}>{t(lang, 'footer.legal')}</a>
      <a href={p('/datenschutz/', '/en/data-privacy/')}>{t(lang, 'footer.privacy')}</a>
    </nav>
  </div>
  <div class="tp-container copy">© {year} Teraport GmbH</div>
</footer>
<style>
  .site-footer { background: var(--tp-ink); color: #cfd8e3; margin-top: 4rem; padding-block: 2.5rem 1.25rem; font-size: 0.95rem; }
  .cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2rem; align-items: start; }
  .tagline { color: var(--tp-blue-light); margin-top: 0.75rem; }
  address { font-style: normal; line-height: 1.8; }
  .site-footer a { color: #e8eef5; text-decoration: none; }
  .site-footer a:hover { color: var(--tp-blue-light); }
  .site-footer nav { display: grid; gap: 0.5rem; }
  .copy { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #2a3b52; color: #8a97a6; font-size: 0.85rem; }
</style>
```

- [ ] **Step 4: `SiteLayout.astro` erstellen**

```astro
---
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import type { Lang } from '../i18n/ui.ts';
interface Props { title: string; lang?: Lang; description?: string; altHref?: string; }
const { title, lang = 'de', description = '', altHref } = Astro.props;
const alt = altHref ?? (lang === 'de' ? '/en/' : '/');
---
<BaseLayout title={title} lang={lang} description={description}>
  <Header lang={lang} altHref={alt} />
  <main><slot /></main>
  <Footer lang={lang} />
</BaseLayout>
```

- [ ] **Step 5: Prose-/Utility-Styles in `global.css` ergänzen (ans Dateiende anhängen)**

```css
/* --- Inhaltsseiten (Prose) --- */
.prose { max-width: 46rem; margin-inline: auto; padding-block: 2.5rem; }
.prose h1 { font-size: 2rem; margin-bottom: 0.5rem; }
.prose blockquote {
  margin: 2rem 0 0.75rem; padding: 0;
  border: 0; color: var(--tp-blue); font-weight: 800; font-size: 1.2rem;
}
.prose ul { padding-left: 1.25rem; }
.prose li { margin-block: 0.25rem; }
.prose a { word-break: break-word; }
.teaser { color: var(--tp-gray); font-size: 1.1rem; margin-top: 0; }

/* --- Abschnitts-Utilities --- */
.section { padding-block: 3rem; }
.section-title { font-size: 1.5rem; margin-bottom: 1.25rem; }
```

- [ ] **Step 6: Platzhalter-Startseite kurz auf SiteLayout umstellen (voller Inhalt kommt in Task 5)**

`src/pages/index.astro`:
```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';
---
<SiteLayout title="Teraport" lang="de" altHref="/en/">
  <div class="tp-container section"><h1>Teraport</h1></div>
</SiteLayout>
```

- [ ] **Step 7: Build + Tests ausführen**

Run: `npm run build && npm test`
Expected: Build PASS; `dist/index.html` enthält `site-header` und `site-footer`; alle Tests grün.

- [ ] **Step 8: Commit**

```bash
git add src/components src/layouts src/styles/global.css src/pages/index.astro
git commit -m "feat: Header, Footer und SiteLayout mit Sprachumschalter"
```

---

### Task 4: Produkt-Inhalte (products-Collection: mido & veo, de/en)

**Files:**
- Create: `src/content/products/de/mido.md`, `src/content/products/de/veo.md`
- Create: `src/content/products/en/mido.md`, `src/content/products/en/veo.md`
- Delete: `src/content/products/{de,en}/.gitkeep`

**Interfaces:**
- Consumes: `productSchema` (title, lang, slug, order, teaser) aus Plan 1.
- Produces: 4 validierende Produkt-Einträge; Texte basieren auf migrierter News-Copy (mido) bzw. der extrahierten veo-Seite — redaktionelle Feinarbeit bleibt Auftraggeber-Aufgabe.

- [ ] **Step 1: `src/content/products/de/mido.md`**

```markdown
---
title: "mido"
lang: de
slug: "mido"
order: 1
teaser: "Werkzeugkostenkalkulation aus 3D-CAD-Modellen – schnell, transparent, nachvollziehbar."
---

Bei der modernen Produktentwicklung ist frühe Kostentransparenz oft der Unterschied zwischen Erfolg und Misserfolg. Ob Kunststoffspritzguss, Druckguss oder Blechstanzen: Die Kosten für Formen und Werkzeuge sind der wichtigste Kostenfaktor für den Endpreis eines Teils.

Mit **mido** wird die Werkzeugkostenkalkulation zu einer leicht zu bewältigenden Aufgabe: eine visuell unterstützte, regelbasierte Werkzeug- und Formenkonfiguration, kombiniert mit der automatischen Erkennung von Kostentreibern direkt auf dem 3D-CAD-Modell.

## Das leistet mido

- Analyse von CAD-Modellen und Ableitung einer klaren, nachvollziehbaren Werkzeugkostenkalkulation
- Automatische Erkennung von Kostentreibern auf 3D-CAD-Geometrien
- Regelbasierte Werkzeug- und Formenkonfiguration mit visueller Unterstützung
- Kurze Berechnungszeiten und klar strukturierte Reports
- Einsatz in frühen Entwicklungsphasen: belastbare Kostenstrukturen, volle Kostenkontrolle

## Für wen?

Werkzeug- und Formenbauer, OEMs und Zulieferer in Kunststoffspritzguss, Druckguss und Stanztechnik – überall dort, wo Werkzeugkosten früh, schnell und belastbar bewertet werden müssen.

**Jetzt testen:** Fordern Sie unter [www.vxmido.com](https://www.vxmido.com) eine Testlizenz an.
```

- [ ] **Step 2: `src/content/products/en/mido.md`**

```markdown
---
title: "mido"
lang: en
slug: "mido"
order: 1
teaser: "Tool cost calculation from 3D CAD models – fast, transparent, traceable."
---

In modern product development, early cost transparency often makes the difference between success and failure. Whether injection molding, die casting or sheet-metal stamping: tool and mold costs are the most important cost factor for the final price of a part.

**mido** turns tool cost calculation into an easily manageable task: visually supported, rule-based tool and mold configuration combined with automatic detection of cost drivers directly on the 3D CAD model.

## What mido does

- Analyzes CAD models and derives a clear, traceable tool cost calculation
- Automatically detects cost drivers on 3D CAD geometry
- Rule-based tool and mold configuration with visual support
- Short calculation times and clearly structured reports
- Built for early development phases: reliable cost structures, full cost control

## Who is it for?

Tool and mold makers, OEMs and suppliers in injection molding, die casting and stamping – wherever tool costs need to be assessed early, quickly and reliably.

**Try it now:** Request a trial license at [www.vxmido.com](https://www.vxmido.com).
```

- [ ] **Step 3: `src/content/products/de/veo.md`**

```markdown
---
title: "veo"
lang: de
slug: "veo"
order: 2
teaser: "Leistungsfähiger 3D-Viewer für große Baugruppen – DMU, Analyse, Kalkulation und Simulation."
---

Mit **veo** stellt Teraport seinen Kunden einen leistungsfähigen 3D-Viewer zur Verfügung. Im Fokus steht die schnelle Visualisierung großer Baugruppen. Durch eine Vielzahl verfügbarer CAD-Schnittstellen ist praktisch jedes gängige 3D-Modell einles- und darstellbar.

Neben grundsätzlichen Funktionen wie Messen und Schneiden bietet veo eine breite Auswahl an Zusatzfunktionen im Umfeld DMU, Analyse, Kalkulation und Simulation, die in optional erhältlichen Workbenches gruppiert sind.

## Die Funktionen im Überblick

- Hohe Visualisierungsleistung: viele Modelle, kurze Ladezeiten
- 3D-Visualisierung: Drehen, Zoomen, Schieben, Fokus setzen, individuelle Mausbelegung, 3D-Connexion-Spacemouse-Support
- Umfangreiche CAD-Schnittstellen für alle gängigen Formate
- Mess- und Schnittfunktionen
- Erweiterbar durch Workbenches: DMU, Analyse, Kalkulation, Simulation

## Individuelle Applikationen

Für Kunden mit besonderen Anforderungen kann veo durch sein flexibles Konzept die Basis für individuelle Applikationen sein, die sich der Visualisierung und Interaktion mit 3D-Bauteilen bedienen. Die Architektur ermöglicht die schnelle, stabile Umsetzung kundenspezifischer Plugins – ein in der Praxis verifiziertes Konzept.
```

- [ ] **Step 4: `src/content/products/en/veo.md`**

```markdown
---
title: "veo"
lang: en
slug: "veo"
order: 2
teaser: "Powerful 3D viewer for large assemblies – DMU, analysis, costing and simulation."
---

With **veo**, Teraport provides its customers with a powerful 3D viewer focused on fast visualization of large assemblies. Thanks to a wide range of CAD interfaces, virtually every common 3D model can be loaded and displayed.

In addition to fundamental functions such as measuring and sectioning, veo offers a broad selection of additional functions around DMU, analysis, costing and simulation, grouped into optional workbenches.

## Features at a glance

- High visualization performance: many models, short loading times
- 3D visualization: rotate, zoom, pan, set focus, custom mouse mapping, 3Dconnexion SpaceMouse support
- Extensive CAD interfaces for all common formats
- Measuring and sectioning functions
- Extendable via workbenches: DMU, analysis, costing, simulation

## Custom applications

For customers with special requirements, veo's flexible concept can serve as the basis for custom applications built on visualization of and interaction with 3D parts. The architecture enables fast, stable implementation of customer-specific plugins – a concept verified in practice.
```

- [ ] **Step 5: `.gitkeep`-Dateien löschen, Build ausführen**

Run: `rm src/content/products/de/.gitkeep src/content/products/en/.gitkeep && npm run build`
Expected: Build PASS, keine Schema-Fehler, keine „No files found"-Warnung mehr für `products`.

- [ ] **Step 6: Commit**

```bash
git add src/content/products
git commit -m "feat: Produkt-Inhalte mido und veo (de/en) für die products-Collection"
```

---

### Task 5: Startseite DE/EN (Layout A) + Hero/ProductTile/BenefitsBar/NewsCard

**Files:**
- Create: `src/components/Hero.astro`, `src/components/ProductTile.astro`, `src/components/BenefitsBar.astro`, `src/components/NewsCard.astro`
- Modify: `src/pages/index.astro` (echte Startseite DE)
- Create: `src/pages/en/index.astro` (Startseite EN)

**Interfaces:**
- Consumes: `getCollection('products'|'news')`, `t`, `newsByLang`, `newsPath`.
- Produces: Startseiten-Komponenten; `ProductTile` Props `{ title, teaser, href, more }`; `NewsCard` Props `{ title, date, href, lang }`; `Hero` Props `{ kicker, title, ctaLabel, ctaHref }`.

- [ ] **Step 1: `Hero.astro`**

```astro
---
interface Props { kicker: string; title: string; ctaLabel: string; ctaHref: string; }
const { kicker, title, ctaLabel, ctaHref } = Astro.props;
---
<section class="hero">
  <div class="tp-container">
    <p class="kicker">{kicker}</p>
    <h1>{title}</h1>
    <a class="cta" href={ctaHref}>{ctaLabel}</a>
  </div>
</section>
<style>
  .hero { background: linear-gradient(135deg, var(--tp-blue) 0%, #1d4e86 100%); color: var(--tp-white); padding-block: 4.5rem; }
  .kicker { color: var(--tp-blue-light); letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.85rem; font-weight: 700; margin: 0 0 0.75rem; }
  h1 { color: var(--tp-white); font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; margin: 0 0 1.5rem; max-width: 34ch; }
  .cta { display: inline-block; background: var(--tp-white); color: var(--tp-blue); font-weight: 700; padding: 0.7rem 1.4rem; border-radius: 8px; text-decoration: none; }
  .cta:hover { filter: brightness(0.95); }
</style>
```

- [ ] **Step 2: `ProductTile.astro`**

```astro
---
interface Props { title: string; teaser: string; href: string; more: string; }
const { title, teaser, href, more } = Astro.props;
---
<a class="tile" href={href}>
  <h3>{title}</h3>
  <p>{teaser}</p>
  <span class="more">{more} →</span>
</a>
<style>
  .tile { display: flex; flex-direction: column; gap: 0.5rem; background: var(--tp-white); border: 1px solid #e5e9ef; border-radius: 10px; padding: 1.5rem; text-decoration: none; color: var(--tp-ink); transition: box-shadow 0.15s ease, border-color 0.15s ease; }
  .tile:hover { border-color: var(--tp-blue-light); box-shadow: 0 4px 18px rgb(18 35 58 / 8%); }
  h3 { margin: 0; font-size: 1.35rem; color: var(--tp-blue); }
  p { margin: 0; color: var(--tp-gray); }
  .more { color: var(--tp-blue); font-weight: 700; font-size: 0.9rem; margin-top: auto; }
</style>
```

- [ ] **Step 3: `BenefitsBar.astro`**

```astro
---
import { t, type Lang } from '../i18n/ui.ts';
interface Props { lang: Lang; }
const { lang } = Astro.props;
const items = [t(lang, 'benefits.1'), t(lang, 'benefits.2'), t(lang, 'benefits.3')];
---
<section class="benefits">
  <div class="tp-container row">
    {items.map((b) => <span>✓ {b}</span>)}
  </div>
</section>
<style>
  .benefits { background: var(--tp-bg); padding-block: 1.25rem; }
  .row { display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; color: var(--tp-ink); font-weight: 600; }
  span { white-space: nowrap; }
</style>
```

- [ ] **Step 4: `NewsCard.astro`**

```astro
---
import type { Lang } from '../i18n/ui.ts';
interface Props { title: string; date: Date; href: string; lang: Lang; }
const { title, date, href, lang } = Astro.props;
const fmt = date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
---
<a class="card" href={href}>
  <time datetime={date.toISOString().slice(0, 10)}>{fmt}</time>
  <h3>{title}</h3>
</a>
<style>
  .card { display: block; background: var(--tp-white); border: 1px solid #e5e9ef; border-radius: 10px; padding: 1.1rem 1.25rem; text-decoration: none; color: var(--tp-ink); transition: border-color 0.15s ease; }
  .card:hover { border-color: var(--tp-blue-light); }
  time { color: var(--tp-gray); font-size: 0.85rem; }
  h3 { margin: 0.3rem 0 0; font-size: 1.05rem; line-height: 1.35; }
</style>
```

- [ ] **Step 5: Startseite DE `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import SiteLayout from '../layouts/SiteLayout.astro';
import Hero from '../components/Hero.astro';
import ProductTile from '../components/ProductTile.astro';
import BenefitsBar from '../components/BenefitsBar.astro';
import NewsCard from '../components/NewsCard.astro';
import { t } from '../i18n/ui.ts';
import { newsByLang, newsPath } from '../lib/news.ts';

const lang = 'de' as const;
const products = (await getCollection('products', (e) => e.data.lang === lang))
  .sort((a, b) => a.data.order - b.data.order);
const latest = newsByLang(await getCollection('news'), lang).slice(0, 3);
---
<SiteLayout
  title="Teraport – Software für Werkzeugkostenkalkulation & 3D-Visualisierung"
  lang={lang}
  description="Teraport GmbH: mido (Werkzeugkostenkalkulation aus CAD) und veo (3D-Viewer für große Baugruppen). Software und Engineering aus München."
  altHref="/en/"
>
  <Hero
    kicker={t(lang, 'home.hero.kicker')}
    title={t(lang, 'home.hero.title')}
    ctaLabel={t(lang, 'home.hero.cta')}
    ctaHref="/kontakt/"
  />

  <section class="tp-container section">
    <h2 class="section-title">{t(lang, 'home.products.title')}</h2>
    <div class="grid-2">
      {products.map((p) => (
        <ProductTile title={p.data.title} teaser={p.data.teaser} href={`/${p.data.slug}/`} more={t(lang, 'product.more')} />
      ))}
    </div>
  </section>

  <BenefitsBar lang={lang} />

  <section class="tp-container section">
    <div class="row-between">
      <h2 class="section-title">{t(lang, 'home.news.title')}</h2>
      <a href="/news/">{t(lang, 'home.news.all')} →</a>
    </div>
    <div class="grid-3">
      {latest.map((n) => (
        <NewsCard title={n.data.title} date={n.data.date} href={newsPath(n)} lang={lang} />
      ))}
    </div>
  </section>
</SiteLayout>
<style>
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }
  .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; }
  .row-between { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
</style>
```

- [ ] **Step 6: Startseite EN `src/pages/en/index.astro`**

Identisch zu Step 5 mit diesen Abweichungen: `const lang = 'en' as const;`, `altHref="/"`,
`title="Teraport – Software for tool cost calculation & 3D visualization"`,
`description="Teraport GmbH: mido (tool cost calculation from CAD) and veo (3D viewer for large assemblies). Software and engineering from Munich."`,
Hero-`ctaHref="/en/contact/"`, Produkt-`href={`/en/${p.data.slug}/`}`, News-Link `/en/news/`. (Alle Import-Pfade eine Ebene tiefer: `../../`.)

- [ ] **Step 7: Build + Tests**

Run: `npm run build && npm test`
Expected: Build PASS; `dist/index.html` und `dist/en/index.html` enthalten je 2 Produkt-Kacheln und 3 News-Karten; Tests grün.

- [ ] **Step 8: Commit**

```bash
git add src/components src/pages/index.astro src/pages/en/index.astro
git commit -m "feat: Startseiten de/en mit Hero, Produkt-Kacheln, Nutzen-Leiste und News"
```

---

### Task 6: Produkt-Detailseiten

**Files:**
- Create: `src/pages/[product].astro`
- Create: `src/pages/en/[product].astro`

**Interfaces:**
- Consumes: `products`-Collection, `render()` aus `astro:content`, `SiteLayout`.
- Produces: statisch generierte Seiten `/mido/`, `/veo/`, `/en/mido/`, `/en/veo/`; Sprachumschalter zeigt auf das jeweilige Gegenstück.

- [ ] **Step 1: `src/pages/[product].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import SiteLayout from '../layouts/SiteLayout.astro';

export async function getStaticPaths() {
  const products = await getCollection('products', (e) => e.data.lang === 'de');
  return products.map((entry) => ({ params: { product: entry.data.slug }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<SiteLayout
  title={`${entry.data.title} – Teraport`}
  lang="de"
  description={entry.data.teaser}
  altHref={`/en/${entry.data.slug}/`}
>
  <article class="tp-container prose">
    <h1>{entry.data.title}</h1>
    <p class="teaser">{entry.data.teaser}</p>
    <Content />
  </article>
</SiteLayout>
```

- [ ] **Step 2: `src/pages/en/[product].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import SiteLayout from '../../layouts/SiteLayout.astro';

export async function getStaticPaths() {
  const products = await getCollection('products', (e) => e.data.lang === 'en');
  return products.map((entry) => ({ params: { product: entry.data.slug }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<SiteLayout
  title={`${entry.data.title} – Teraport`}
  lang="en"
  description={entry.data.teaser}
  altHref={`/${entry.data.slug}/`}
>
  <article class="tp-container prose">
    <h1>{entry.data.title}</h1>
    <p class="teaser">{entry.data.teaser}</p>
    <Content />
  </article>
</SiteLayout>
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS; `dist/mido/index.html`, `dist/veo/index.html`, `dist/en/mido/index.html`, `dist/en/veo/index.html` existieren.

- [ ] **Step 4: Commit**

```bash
git add "src/pages/[product].astro" "src/pages/en/[product].astro"
git commit -m "feat: Produkt-Detailseiten mido/veo (de/en)"
```

---

### Task 7: Unternehmen & Rechtliches (pages-Collection rendern)

**Files:**
- Create: `src/pages/unternehmen.astro`, `src/pages/impressum.astro`, `src/pages/datenschutz.astro`
- Create: `src/pages/en/company.astro`, `src/pages/en/legal-notice.astro`, `src/pages/en/data-privacy.astro`

**Interfaces:**
- Consumes: `pages`-Collection (IDs `de/unternehmen`, `de/impressum`, `de/datenschutz`, `en/company`, `en/legal-notice`, `en/data-privacy`), `render()`, `SiteLayout`, `altPath`.
- Produces: 6 statische Inhaltsseiten. Muster identisch — pro Seite nur ID/Titel/lang/altHref anders.

- [ ] **Step 1: `src/pages/unternehmen.astro` (Muster für alle 6)**

```astro
---
import { getEntry, render } from 'astro:content';
import SiteLayout from '../layouts/SiteLayout.astro';

const entry = await getEntry('pages', 'de/unternehmen');
if (!entry) throw new Error('Content pages/de/unternehmen fehlt – npm run migrate ausführen.');
const { Content } = await render(entry);
---
<SiteLayout title={`${entry.data.title} – Teraport`} lang="de" altHref="/en/company/">
  <article class="tp-container prose">
    <h1>{entry.data.title}</h1>
    <Content />
  </article>
</SiteLayout>
```

- [ ] **Step 2: Die übrigen 5 Seiten nach demselben Muster**

| Datei | getEntry-ID | lang | altHref |
|---|---|---|---|
| `src/pages/impressum.astro` | `de/impressum` | de | `/en/legal-notice/` |
| `src/pages/datenschutz.astro` | `de/datenschutz` | de | `/en/data-privacy/` |
| `src/pages/en/company.astro` | `en/company` | en | `/unternehmen/` (Import: `../../layouts/…`) |
| `src/pages/en/legal-notice.astro` | `en/legal-notice` | en | `/impressum/` |
| `src/pages/en/data-privacy.astro` | `en/data-privacy` | en | `/datenschutz/` |

Jeweils komplette Datei wie Step 1, nur ID/lang/altHref/Fehlermeldung angepasst.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS; `dist/unternehmen/`, `dist/impressum/`, `dist/datenschutz/`, `dist/en/company/`, `dist/en/legal-notice/`, `dist/en/data-privacy/` existieren (je `index.html`).

- [ ] **Step 4: Commit**

```bash
git add src/pages/unternehmen.astro src/pages/impressum.astro src/pages/datenschutz.astro src/pages/en/company.astro src/pages/en/legal-notice.astro src/pages/en/data-privacy.astro
git commit -m "feat: Unternehmens- und Rechtsseiten aus pages-Collection (de/en)"
```

---

### Task 8: News-Übersicht & News-Detail (de/en)

**Files:**
- Create: `src/pages/news/index.astro`, `src/pages/news/[slug].astro`
- Create: `src/pages/en/news/index.astro`, `src/pages/en/news/[slug].astro`

**Interfaces:**
- Consumes: `news`-Collection, `newsByLang`, `newsSlug`, `newsPath`, `counterpartPath`, `NewsCard`, `render()`.
- Produces: `/news/` (50 Einträge), `/en/news/` (44), Detailseiten je Beitrag; Sprachumschalter auf Detailseiten via `counterpartPath`.

- [ ] **Step 1: `src/pages/news/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import SiteLayout from '../../layouts/SiteLayout.astro';
import NewsCard from '../../components/NewsCard.astro';
import { t } from '../../i18n/ui.ts';
import { newsByLang, newsPath } from '../../lib/news.ts';

const lang = 'de' as const;
const entries = newsByLang(await getCollection('news'), lang);
---
<SiteLayout title="News – Teraport" lang={lang} altHref="/en/news/">
  <section class="tp-container section">
    <h1>{t(lang, 'news.title')}</h1>
    <div class="list">
      {entries.map((n) => (
        <NewsCard title={n.data.title} date={n.data.date} href={newsPath(n)} lang={lang} />
      ))}
    </div>
  </section>
</SiteLayout>
<style>
  .list { display: grid; gap: 0.9rem; margin-top: 1.5rem; }
</style>
```

- [ ] **Step 2: `src/pages/en/news/index.astro`** — identisch, mit `lang = 'en'`, `altHref="/news/"`, Titel `"News – Teraport"`, Import-Pfade `../../../`.

- [ ] **Step 3: `src/pages/news/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import SiteLayout from '../../layouts/SiteLayout.astro';
import { t } from '../../i18n/ui.ts';
import { newsSlug, counterpartPath } from '../../lib/news.ts';

export async function getStaticPaths() {
  const all = await getCollection('news');
  return all
    .filter((e) => e.data.lang === 'de')
    .map((entry) => ({
      params: { slug: newsSlug(entry.id) },
      props: { entry, altHref: counterpartPath(entry, all) },
    }));
}

const { entry, altHref } = Astro.props;
const { Content } = await render(entry);
const fmt = entry.data.date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
---
<SiteLayout title={`${entry.data.title} – Teraport`} lang="de" altHref={altHref}>
  <article class="tp-container prose">
    <p><a href="/news/">← {t('de', 'news.back')}</a></p>
    <time datetime={entry.data.date.toISOString().slice(0, 10)}>{fmt}</time>
    <h1>{entry.data.title}</h1>
    <Content />
  </article>
</SiteLayout>
```

- [ ] **Step 4: `src/pages/en/news/[slug].astro`** — identisch mit: Filter `e.data.lang === 'en'`, `lang="en"`, Datum `toLocaleDateString('en-GB', …)`, Back-Link `/en/news/` + `t('en','news.back')`, Import-Pfade `../../../`.

- [ ] **Step 5: Build + Zählung**

Run:
```bash
npm run build && ls dist/news | wc -l && ls dist/en/news | wc -l
```
Expected: Build PASS; `dist/news` = **51** Einträge (50 Beiträge + index.html), `dist/en/news` = **45** (44 + index.html).

- [ ] **Step 6: Commit**

```bash
git add src/pages/news src/pages/en/news
git commit -m "feat: News-Übersicht und -Detailseiten (de/en) mit Übersetzungs-Verknüpfung"
```

---

### Task 9: Kontakt (de/en) + Gesamt-Verifikation & Push

**Files:**
- Create: `src/pages/kontakt.astro`, `src/pages/en/contact.astro`

**Interfaces:**
- Consumes: `SiteLayout`, `t`; Kontaktdaten aus den Global Constraints.
- Produces: Kontaktseiten mit Adresse/Tel/Mail (echtes Formular kommt in Plan 3); vollständige Routen-Verifikation; Push.

- [ ] **Step 1: `src/pages/kontakt.astro`**

```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';
import { t } from '../i18n/ui.ts';
const lang = 'de' as const;
---
<SiteLayout title="Kontakt – Teraport" lang={lang} altHref="/en/contact/">
  <section class="tp-container section contact">
    <h1>{t(lang, 'contact.title')}</h1>
    <p class="teaser">{t(lang, 'contact.intro')}</p>
    <div class="card">
      <address>
        <strong>Teraport GmbH</strong><br />
        Kellerstr. 29<br />
        81667 München
      </address>
      <p>
        Tel.: <a href="tel:+4989651086700">+49 (0)89 651086 700</a><br />
        E-Mail: <a href="mailto:info@teraport.de">info@teraport.de</a>
      </p>
      <a class="cta" href="mailto:info@teraport.de?subject=Anfrage%20%C3%BCber%20teraport.de">{t(lang, 'contact.mail.cta')}</a>
    </div>
  </section>
</SiteLayout>
<style>
  .contact { max-width: 46rem; margin-inline: auto; }
  .card { background: var(--tp-bg); border-radius: 10px; padding: 1.75rem; margin-top: 1.5rem; }
  address { font-style: normal; line-height: 1.8; }
  .cta { display: inline-block; background: var(--tp-blue); color: var(--tp-white); font-weight: 700; padding: 0.65rem 1.3rem; border-radius: 8px; text-decoration: none; margin-top: 0.75rem; }
  .cta:hover { filter: brightness(1.08); }
</style>
```

- [ ] **Step 2: `src/pages/en/contact.astro`** — identisch mit `lang='en'`, `altHref="/kontakt/"`, Titel `"Contact – Teraport"`, mailto-Subject `Inquiry%20via%20teraport.de`, Import `../../…`.

- [ ] **Step 3: Gesamt-Verifikation aller Routen**

Run:
```bash
npm test && npm run build && for f in \
  index.html en/index.html \
  mido/index.html veo/index.html en/mido/index.html en/veo/index.html \
  unternehmen/index.html en/company/index.html \
  news/index.html en/news/index.html \
  kontakt/index.html en/contact/index.html \
  impressum/index.html datenschutz/index.html en/legal-notice/index.html en/data-privacy/index.html \
; do test -f "dist/$f" && echo "OK  $f" || echo "FEHLT $f"; done
```
Expected: alle Tests grün; Build PASS; 16 × `OK`, kein `FEHLT`. Zusätzlich: `grep -L "site-header" dist/index.html` leer (Header überall via SiteLayout).

- [ ] **Step 4: Commit & Push**

```bash
git add src/pages/kontakt.astro src/pages/en/contact.astro
git commit -m "feat: Kontaktseiten de/en"
git push
```

---

## Self-Review

**Spec-Abdeckung (Plan-2-Teil):** Header/Nav + Sprachumschalter ✔ (T3), Hero/Produkt-Kacheln/Nutzen-Leiste/News-Karten = Homepage-Layout A ✔ (T5), Produktseiten mido & veo ✔ (T4+T6), Unternehmen ✔ (T7), News Übersicht+Detail mit DE↔EN-Verknüpfung ✔ (T8), Kontakt ✔ (T9), Impressum/Datenschutz ✔ (T7), Footer mit Adresse/Rechtlichem ✔ (T3). — **Bewusst NICHT in Plan 2** (→ Plan 3): echtes Kontaktformular, hreflang/SEO/Sitemap/Favicon, Lighthouse/Link-Check, Deployment; mido-Bildmaterial (offener Punkt Auftraggeber).

**Platzhalter-Scan:** Alle Steps enthalten vollständigen Code oder exakte Muster-Abweichungstabellen (T7 Step 2, T8 Steps 2/4, T9 Step 2 verweisen auf das jeweils vollständig gezeigte Muster mit exakt benannten Abweichungen — zulässig, da das Muster komplett im selben Task steht).

**Typ-Konsistenz:** `t(lang,key)`/`Lang`/`UiKey` (T1) werden in T3/T5/T8/T9 identisch konsumiert; `newsByLang/newsSlug/newsPath/counterpartPath` (T2) in T5/T8; `SiteLayout`-Props (T3) überall gleich; `productSchema`-Felder (Plan 1) decken alle in T4 verwendeten Frontmatter-Felder ab; Collection-IDs (`de/unternehmen` …) entsprechen dem `entryToId`-Schema aus Plan 1.

**Risiken:** (1) `render()`/`getEntry` API: Astro 5 `astro:content` — falls eine Signatur abweicht, bricht der Build sichtbar (kein stiller Fehler). (2) Die 4 DE/EN-News-Paare mit identischem Slug kollidieren nicht (Pfade sind sprachgetrennt `/news/…` vs. `/en/news/…`). (3) `pages`-Inhalte enthalten Alt-HTML — wird bewusst gerendert; GA-Absätze in Impressum/Datenschutz als Go-live-Prüfpunkt notiert.
