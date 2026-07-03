# Teraport Website – Plan 1: Fundament & Inhalts-Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein lauffähiges Astro-Gerüst aufsetzen und alle vorhandenen Inhalte (News, benötigte Medien, Enfold-Seitentexte) aus dem Backup in validierte, dateibasierte Content-Collections migrieren, sodass `astro build` fehlerfrei durchläuft.

**Architecture:** Statische Astro-5-Seite mit dateibasierten Content-Collections (Glob-Loader + Zod-Schema). Inhalte werden durch idempotente Node-Skripte (`scripts/*.mjs`) aus den lokalen Backup-Quellen (`news-export/`, `wordpress-restore/`, `DB…​.sql.gz`) nach `src/content/` und `src/assets/` überführt. Reine Transformationslogik ist von I/O getrennt und mit Vitest getestet.

**Tech Stack:** Astro 5, TypeScript, Zod (über Astro `content`), Vitest, `@fontsource/*` (lokal gebündelte Schriften), Node 25 / npm 11, Python 3.12 (nur für das Entpacken/Parsen des SQL-Dumps im Extraktions-Skript, optional — primär Node).

## Global Constraints

- **Node ≥ 20**, entwickelt/geprüft mit Node 25.8.1, npm 11.11.0. Eine `.nvmrc` mit `20` als Untergrenze.
- **Sprachen:** Zweisprachig `de` und `en`. Alle Content-Collections tragen ein `lang`-Feld (`"de" | "en"`).
- **Produktname:** Das Produkt heißt durchgängig **`veo`** (niemals „veoCAST") in allen neu erzeugten Inhalten/Bezeichnern.
- **DSGVO:** Keine externen CDN-/Font-Requests. Schriften werden lokal über `@fontsource` gebündelt.
- **Marke/Farben (CSS-Variablen, exakte Werte):** `--tp-blue:#2d6cb2`, `--tp-blue-light:#a9c7e0`, `--tp-gray:#8a9299`, `--tp-ink:#12233a`, `--tp-bg:#f5f7fa`, `--tp-white:#ffffff`.
- **Backups sind Quelle, nicht Ziel:** `news-export/`, `wordpress-restore/`, `*.sql.gz`, `*.zip` werden **nur gelesen**, nie verändert. Erzeugte Inhalte landen unter `src/`. `wordpress-restore/`, `*.sql.gz`, `*.zip` bleiben per `.gitignore` untracked.
- **Idempotenz:** Jedes Migrations-Skript kann mehrfach ausgeführt werden und erzeugt dasselbe Ergebnis (Zielordner wird vor dem Schreiben geleert).
- **Commits:** Nach jeder Task committen. Commit-Sprache Deutsch, Präfixe `feat:`/`test:`/`chore:`.

---

## Dateistruktur (nach Plan 1)

```
package.json                     # Astro + Vitest Scripts/Deps
astro.config.mjs                 # i18n (de/en), Build-Optionen
tsconfig.json                    # strict TS
.nvmrc                           # 20
vitest.config.ts                 # Test-Konfiguration
src/
├── content.config.ts            # Collections news, products, pages (+ Zod-Schema)
├── styles/
│   └── global.css               # Design-Tokens (CSS-Variablen), Reset, Basistypo
├── layouts/
│   └── BaseLayout.astro         # HTML-Grundgerüst (Head, lang-Attr, Slot)
├── pages/
│   └── index.astro              # temporäre Platzhalter-Startseite (in Plan 2 ersetzt)
├── assets/                      # ZIEL der Medien-Extraktion (Logo, veo-Bilder, Partnerlogos)
└── content/
    ├── news/{de,en}/*.md        # ZIEL der News-Migration
    └── pages/{de,en}/*.md       # ZIEL der Enfold-Seitentext-Extraktion
scripts/
├── lib/
│   ├── rewrite-news.mjs         # reine Funktion: Body/Frontmatter-Normalisierung
│   ├── strip-avia.mjs           # reine Funktion: Enfold-Shortcode → Markdown/Text
│   └── sql-posts.mjs            # reine Funktion: wp_posts aus SQL-Text parsen
├── import-news.mjs              # I/O-Runner News
├── extract-assets.mjs           # I/O-Runner Medien
└── extract-pages.mjs            # I/O-Runner Enfold-Seiten
tests/
├── rewrite-news.test.ts
├── strip-avia.test.ts
├── sql-posts.test.ts
└── content-schema.test.ts
```

---

### Task 1: Astro-Projekt-Gerüst

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.nvmrc`
- Create: `src/pages/index.astro`

**Interfaces:**
- Consumes: nichts.
- Produces: lauffähiges `npm run build` / `npm run dev`; Astro-i18n-Routing mit Default-Locale `de` und `en`.

- [ ] **Step 1: `package.json` anlegen**

```json
{
  "name": "tpwebsite",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "import:news": "node scripts/import-news.mjs",
    "extract:assets": "node scripts/extract-assets.mjs",
    "extract:pages": "node scripts/extract-pages.mjs"
  },
  "dependencies": {
    "astro": "^5.6.0",
    "@fontsource/inter": "^5.1.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Abhängigkeiten installieren**

Run: `npm install`
Expected: `node_modules/` entsteht, keine Fehler (Warnungen ok).

- [ ] **Step 3: `.nvmrc` anlegen**

```
20
```

- [ ] **Step 4: `tsconfig.json` anlegen**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 5: `astro.config.mjs` anlegen (i18n de/en)**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.teraport.de',
  i18n: {
    locales: ['de', 'en'],
    defaultLocale: 'de',
    routing: {
      prefixDefaultLocale: false, // /… ist Deutsch, /en/… ist Englisch
    },
  },
});
```

- [ ] **Step 6: Platzhalter-Startseite `src/pages/index.astro` anlegen**

```astro
---
// Temporär – wird in Plan 2 durch die echte Startseite ersetzt.
---
<html lang="de">
  <head><meta charset="utf-8" /><title>Teraport</title></head>
  <body><h1>Teraport – Neuaufbau</h1></body>
</html>
```

- [ ] **Step 7: Build ausführen und verifizieren**

Run: `npm run build`
Expected: PASS – „Complete!"; `dist/index.html` existiert.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json .nvmrc src/pages/index.astro
git commit -m "feat: Astro-Grundgerüst mit i18n (de/en)"
```

---

### Task 2: Design-Tokens, Schriften & Basis-Layout

**Files:**
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: Astro-Gerüst aus Task 1.
- Produces: `BaseLayout` mit Props `{ title: string; lang?: 'de'|'en'; description?: string }`, das `global.css` und die Schrift einbindet und einen `<slot />` im `<main>` rendert.

- [ ] **Step 1: `src/styles/global.css` mit Design-Tokens anlegen**

```css
/* Lokale Schrift (DSGVO – kein CDN) */
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/800.css';

:root {
  --tp-blue: #2d6cb2;
  --tp-blue-light: #a9c7e0;
  --tp-gray: #8a9299;
  --tp-ink: #12233a;
  --tp-bg: #f5f7fa;
  --tp-white: #ffffff;

  --tp-font: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  --tp-maxw: 1120px;
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: var(--tp-font);
  color: var(--tp-ink);
  background: var(--tp-white);
  line-height: 1.6;
}
img { max-width: 100%; height: auto; display: block; }
a { color: var(--tp-blue); }
h1, h2, h3 { line-height: 1.15; color: var(--tp-ink); }
.tp-container { max-width: var(--tp-maxw); margin-inline: auto; padding-inline: 1.25rem; }
```

- [ ] **Step 2: `src/layouts/BaseLayout.astro` anlegen**

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
    <main class="tp-container">
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 3: Platzhalter-Startseite auf `BaseLayout` umstellen**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Teraport" lang="de" description="Teraport GmbH – Neuaufbau">
  <h1 style="color: var(--tp-blue)">Teraport – Neuaufbau</h1>
</BaseLayout>
```

- [ ] **Step 4: Build ausführen und verifizieren**

Run: `npm run build`
Expected: PASS; `dist/index.html` enthält den String `--tp-blue` (Styles eingebunden) und die Inter-Schrift-Dateien liegen unter `dist/_astro/`.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/layouts/BaseLayout.astro src/pages/index.astro
git commit -m "feat: Design-Tokens, lokale Inter-Schrift und Basis-Layout"
```

---

### Task 3: Content-Collections & Schema

**Files:**
- Create: `src/content.config.ts`
- Create: `tests/content-schema.test.ts`
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: Astro-Gerüst.
- Produces: drei Collections mit exportierten Zod-Schemata, damit Tests sie unabhängig prüfen können:
  - `newsSchema`: `{ title: string; date: Date; lang: 'de'|'en'; slug: string; wp_id?: number; trid?: number; translation?: string }`
  - `productSchema`: `{ title: string; lang: 'de'|'en'; slug: string; order: number; teaser: string }`
  - `pageSchema`: `{ title: string; lang: 'de'|'en'; slug: string }`

- [ ] **Step 1: `vitest.config.ts` anlegen**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: `src/content.config.ts` mit Schemata und Glob-Loadern anlegen**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lang = z.enum(['de', 'en']);

export const newsSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  lang,
  slug: z.string(),
  wp_id: z.number().optional(),
  trid: z.number().optional(),
  translation: z.string().optional(),
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

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: newsSchema,
});
const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: productSchema,
});
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: pageSchema,
});

export const collections = { news, products, pages };
```

- [ ] **Step 3: Failing test für das News-Schema schreiben**

```ts
// tests/content-schema.test.ts
import { describe, it, expect } from 'vitest';
import { newsSchema, productSchema } from '../src/content.config.ts';

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
});

describe('productSchema', () => {
  it('setzt order auf 0 per Default', () => {
    const p = productSchema.parse({ title: 'veo', lang: 'de', slug: 'veo', teaser: 't' });
    expect(p.order).toBe(0);
  });
});
```

- [ ] **Step 4: Test ausführen (erwartet FAIL, solange `astro:content` in Vitest nicht auflösbar ist)**

Run: `npm test -- tests/content-schema.test.ts`
Expected: FAIL – `astro:content` kann nicht aufgelöst werden.

- [ ] **Step 5: Zod-Schemata in ein test-freundliches Modul auslagern**

`astro:content` ist ein virtuelles Modul und in Vitest nicht importierbar. Schemata daher in `src/content-schemas.ts` verschieben (nur `zod`), und `content.config.ts` importiert von dort.

`src/content-schemas.ts`:
```ts
import { z } from 'zod';

const lang = z.enum(['de', 'en']);

export const newsSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  lang,
  slug: z.string(),
  wp_id: z.number().optional(),
  trid: z.number().optional(),
  translation: z.string().optional(),
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
```

`src/content.config.ts` neu (Schemata importieren, `zod` als Dependency ergänzen):
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { newsSchema, productSchema, pageSchema } from './content-schemas.ts';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: newsSchema,
});
const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: productSchema,
});
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: pageSchema,
});

export const collections = { news, products, pages };
```

Test-Import auf `../src/content-schemas.ts` umstellen:
```ts
import { newsSchema, productSchema } from '../src/content-schemas.ts';
```

`zod` als explizite Dependency ergänzen:
Run: `npm install zod@^3.23.0`

- [ ] **Step 6: Test ausführen (erwartet PASS)**

Run: `npm test -- tests/content-schema.test.ts`
Expected: PASS (3 Tests grün).

- [ ] **Step 7: Leere Zielordner mit `.gitkeep` anlegen, damit der Build die Collections findet**

Create: `src/content/news/de/.gitkeep`, `src/content/news/en/.gitkeep`, `src/content/products/de/.gitkeep`, `src/content/products/en/.gitkeep`, `src/content/pages/de/.gitkeep`, `src/content/pages/en/.gitkeep` (leere Dateien).

Run: `npm run build`
Expected: PASS (leere Collections sind zulässig).

- [ ] **Step 8: Commit**

```bash
git add src/content.config.ts src/content-schemas.ts tests/content-schema.test.ts vitest.config.ts src/content package.json package-lock.json
git commit -m "feat: Content-Collections (news/products/pages) mit Zod-Schema und Tests"
```

---

### Task 4: News-Normalisierung (reine Funktion + Runner)

**Files:**
- Create: `scripts/lib/rewrite-news.mjs`
- Create: `tests/rewrite-news.test.ts`
- Create: `scripts/import-news.mjs`

**Interfaces:**
- Consumes: `news-export/{de,en}/*.md` (Quelle, unverändert).
- Produces: `rewriteNews(raw: string): { frontmatter: object, body: string, out: string }` — normalisiert Bild-/Link-URLs; und einen Runner, der nach `src/content/news/{de,en}/` schreibt.

- [ ] **Step 1: Failing test für `rewriteNews` schreiben**

```ts
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
Mehr auf https://teraport.de/kontakt.
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
```

- [ ] **Step 2: Test ausführen (erwartet FAIL)**

Run: `npm test -- tests/rewrite-news.test.ts`
Expected: FAIL – `rewrite-news.mjs` existiert nicht.

- [ ] **Step 3: `scripts/lib/rewrite-news.mjs` implementieren**

```js
// Reine Transformationslogik – kein Datei-I/O.
import { parse as parseYaml } from 'yaml';

/**
 * @param {string} raw  vollständiger Markdown-Text inkl. Frontmatter
 * @returns {{frontmatter: object, body: string, out: string}}
 */
export function rewriteNews(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('Kein Frontmatter gefunden');
  const frontmatter = parseYaml(m[1]);
  let body = m[2];

  // 1) wp-content/uploads-URLs -> lokale Asset-Pfade
  body = body.replace(
    /https?:\/\/teraport\.de\/wp-content\/uploads\//g,
    '/assets/uploads/'
  );
  // 2) übrige teraport.de-Links relativ machen
  body = body.replace(/https?:\/\/teraport\.de(\/[^\s)]*)/g, '$1');

  const out = `---\n${m[1]}\n---\n${body}`;
  return { frontmatter, body, out };
}
```

- [ ] **Step 4: `yaml` als Dependency ergänzen und Test ausführen (erwartet PASS)**

Run: `npm install yaml@^2.5.0 && npm test -- tests/rewrite-news.test.ts`
Expected: PASS (3 Tests grün).

- [ ] **Step 5: Runner `scripts/import-news.mjs` implementieren**

```js
// I/O-Runner: liest news-export/, schreibt normalisiert nach src/content/news/.
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rewriteNews } from './lib/rewrite-news.mjs';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const SRC = join(root, 'news-export');
const DEST = join(root, 'src/content/news');

for (const lang of ['de', 'en']) {
  const srcDir = join(SRC, lang);
  const destDir = join(DEST, lang);
  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });
  const files = (await readdir(srcDir)).filter((f) => f.endsWith('.md'));
  let n = 0;
  for (const f of files) {
    const raw = await readFile(join(srcDir, f), 'utf8');
    const { out } = rewriteNews(raw);
    await writeFile(join(destDir, f), out, 'utf8');
    n++;
  }
  console.log(`[news] ${lang}: ${n} Dateien migriert`);
}
```

- [ ] **Step 6: Runner ausführen und Build verifizieren**

Run: `npm run import:news && npm run build`
Expected: `[news] de: 50 …`, `[news] en: 44 …`; Build PASS (News-Collection validiert gegen `newsSchema`).

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/rewrite-news.mjs scripts/import-news.mjs tests/rewrite-news.test.ts src/content/news package.json package-lock.json
git commit -m "feat: News aus Export normalisieren und in Content-Collection importieren"
```

---

### Task 5: Medien-Extraktion aus dem Uploads-Backup

**Files:**
- Create: `scripts/extract-assets.mjs`
- Create: `src/assets/manifest.json`

**Interfaces:**
- Consumes: `wordpress-restore/wp-content/uploads/**` (Quelle, unverändert).
- Produces: benötigte Bilder unter `src/assets/uploads/<originalpfad>`; ein `manifest.json`, das die zu kopierenden Quelldateien auflistet (erweiterbar in Plan 2).

- [ ] **Step 1: `src/assets/manifest.json` mit den für V1 nötigen Dateien anlegen**

```json
{
  "files": [
    "2015/02/TP_340_trans.png",
    "2015/02/TP_340_trans_white.png",
    "2015/02/veoCAST_02.jpg",
    "2015/02/veo_CAST_7_bg.png",
    "2015/02/logo_KIT_200.jpg",
    "2015/02/logo_Siemens_Partner_200.jpg",
    "2015/02/logo_zim_200.jpg",
    "2015/02/logo_cadcam_200.jpg"
  ]
}
```

- [ ] **Step 2: `scripts/extract-assets.mjs` implementieren**

```js
// Kopiert die in manifest.json gelisteten Uploads nach src/assets/uploads/.
import { readFile, mkdir, copyFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const UPLOADS = join(root, 'wordpress-restore/wp-content/uploads');
const DEST = join(root, 'src/assets/uploads');

const manifest = JSON.parse(await readFile(join(root, 'src/assets/manifest.json'), 'utf8'));

let ok = 0;
const missing = [];
for (const rel of manifest.files) {
  const from = join(UPLOADS, rel);
  const to = join(DEST, rel);
  try {
    await access(from);
    await mkdir(dirname(to), { recursive: true });
    await copyFile(from, to);
    ok++;
  } catch {
    missing.push(rel);
  }
}
console.log(`[assets] kopiert: ${ok}/${manifest.files.length}`);
if (missing.length) {
  console.warn('[assets] FEHLEND:', missing.join(', '));
  process.exitCode = 1; // nicht still schlucken
}
```

- [ ] **Step 3: Runner ausführen und verifizieren**

Run: `npm run extract:assets`
Expected: `[assets] kopiert: 8/8`, keine FEHLEND-Meldung; `src/assets/uploads/2015/02/TP_340_trans.png` existiert.

- [ ] **Step 4: Commit**

```bash
git add scripts/extract-assets.mjs src/assets/manifest.json src/assets/uploads
git commit -m "feat: benötigte Medien aus Uploads-Backup extrahieren (Logo, veo, Partnerlogos)"
```

---

### Task 6: Enfold-Shortcode-Reiniger (reine Funktion)

**Files:**
- Create: `scripts/lib/strip-avia.mjs`
- Create: `tests/strip-avia.test.ts`

**Interfaces:**
- Consumes: roher `post_content`-String mit Enfold/Avia-`av_`-Shortcodes.
- Produces: `stripAvia(content: string): string` — liefert bereinigten Text/Markdown ohne Layout-Shortcodes.

- [ ] **Step 1: Failing test für `stripAvia` schreiben**

```ts
// tests/strip-avia.test.ts
import { describe, it, expect } from 'vitest';
import { stripAvia } from '../scripts/lib/strip-avia.mjs';

describe('stripAvia', () => {
  it('entfernt Layout-Container-Shortcodes, behält Textinhalt', () => {
    const input = "[av_one_full first]\n[av_textblock size='' ]\nHallo Welt\n[/av_textblock]\n[/av_one_full]";
    expect(stripAvia(input).trim()).toBe('Hallo Welt');
  });

  it('wandelt av_heading in eine Markdown-Überschrift', () => {
    const input = "[av_heading heading='Über uns' tag='h2'][/av_heading]";
    expect(stripAvia(input).trim()).toBe('## Über uns');
  });

  it('entfernt selbstschließende Layout-Shortcodes (av_hr, av_slide)', () => {
    const input = "Text A\n[av_hr class='default']\nText B";
    const out = stripAvia(input);
    expect(out).toContain('Text A');
    expect(out).toContain('Text B');
    expect(out).not.toContain('av_hr');
  });

  it('lässt normalen Text unangetastet', () => {
    expect(stripAvia('Nur Text.')).toBe('Nur Text.');
  });
});
```

- [ ] **Step 2: Test ausführen (erwartet FAIL)**

Run: `npm test -- tests/strip-avia.test.ts`
Expected: FAIL – `strip-avia.mjs` existiert nicht.

- [ ] **Step 3: `scripts/lib/strip-avia.mjs` implementieren**

```js
// Reine Funktion: Enfold/Avia-Shortcodes zu einfachem Markdown/Text reduzieren.

/** Extrahiert ein Attribut aus einem Shortcode-Tag-Inhalt. */
function attr(tagBody, name) {
  const m = tagBody.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`));
  return m ? m[1] : '';
}

/**
 * @param {string} content
 * @returns {string}
 */
export function stripAvia(content) {
  let out = content;

  // 1) av_heading -> Markdown-Überschrift (## / ###) anhand tag='hN'
  out = out.replace(/\[av_heading\b([^\]]*)\](?:\[\/av_heading\])?/g, (_, body) => {
    const heading = attr(body, 'heading');
    const tag = attr(body, 'tag') || 'h2';
    const level = Math.min(6, Math.max(1, parseInt(tag.replace('h', ''), 10) || 2));
    return heading ? `\n${'#'.repeat(level)} ${heading}\n` : '';
  });

  // 2) Textblöcke: Wrapper entfernen, Inhalt behalten
  out = out.replace(/\[av_textblock\b[^\]]*\]([\s\S]*?)\[\/av_textblock\]/g, (_, inner) => `\n${inner}\n`);

  // 3) Alle übrigen paarigen Layout-Shortcodes: Wrapper entfernen, Inhalt behalten
  //    (mehrfach anwenden für Verschachtelung)
  const paired = /\[(av_[a-z_0-9]+)\b[^\]]*\]([\s\S]*?)\[\/\1\]/g;
  let prev;
  do { prev = out; out = out.replace(paired, (_, __, inner) => inner); } while (out !== prev);

  // 4) Selbstschließende / verbleibende einzelne av_-Shortcodes entfernen
  out = out.replace(/\[\/?av_[a-z_0-9]+\b[^\]]*\]/g, '');

  // 5) Mehrfache Leerzeilen zusammenfassen
  out = out.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n');

  return out.trim() === content.trim() ? content : out.trim();
}
```

*Hinweis:* Der letzte Rückgabe-Ausdruck stellt sicher, dass reiner Text (ohne Shortcodes) exakt unverändert zurückkommt (erfüllt Test 4), während bereinigter Inhalt getrimmt wird.

- [ ] **Step 4: Test ausführen (erwartet PASS)**

Run: `npm test -- tests/strip-avia.test.ts`
Expected: PASS (4 Tests grün).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/strip-avia.mjs tests/strip-avia.test.ts
git commit -m "feat: Enfold/Avia-Shortcode-Reiniger mit Tests"
```

---

### Task 7: SQL-Parser für wp_posts (reine Funktion)

**Files:**
- Create: `scripts/lib/sql-posts.mjs`
- Create: `tests/sql-posts.test.ts`

**Interfaces:**
- Consumes: entpackter SQL-Text des Dumps.
- Produces: `parseWpPosts(sql: string): Array<{ id: number, content: string, title: string, status: string, name: string, type: string }>` — tokenisiert die `INSERT INTO \`wp_posts\` VALUES (...)`-Zeilen.

- [ ] **Step 1: Failing test für `parseWpPosts` schreiben**

```ts
// tests/sql-posts.test.ts
import { describe, it, expect } from 'vitest';
import { parseWpPosts } from '../scripts/lib/sql-posts.mjs';

const sql = "INSERT INTO `wp_posts` VALUES " +
  "(734,1,'2015-01-01 00:00:00','0000-00-00 00:00:00','Inhalt A','Homepage','','publish','closed','closed','','homepage','','','2015-01-01 00:00:00','0000-00-00 00:00:00','',0,'http://x/?p=734',0,'page','',0)," +
  "(3255,1,'2015-01-01 00:00:00','0000-00-00 00:00:00','It\\'s veo','veo','','publish','closed','closed','','veo','','','2015-01-01 00:00:00','0000-00-00 00:00:00','',0,'http://x/?p=3255',0,'page','',0);";

describe('parseWpPosts', () => {
  it('parst ID, Titel, Status, Slug, Typ', () => {
    const rows = parseWpPosts(sql);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 734, title: 'Homepage', status: 'publish', name: 'homepage', type: 'page' });
  });

  it('behandelt escaped Quotes im Inhalt korrekt', () => {
    const rows = parseWpPosts(sql);
    expect(rows[1].content).toBe("It's veo");
    expect(rows[1].title).toBe('veo');
  });
});
```

- [ ] **Step 2: Test ausführen (erwartet FAIL)**

Run: `npm test -- tests/sql-posts.test.ts`
Expected: FAIL – `sql-posts.mjs` existiert nicht.

- [ ] **Step 3: `scripts/lib/sql-posts.mjs` implementieren**

```js
// Reiner Tokenizer für die wp_posts-INSERTs eines mysqldump.
// Spaltenreihenfolge (Standard-WP): 0 ID,1 author,2 date,3 date_gmt,4 content,
// 5 title,6 excerpt,7 status,8 comment_status,9 ping_status,10 password,
// 11 name,12 to_ping,13 pinged,14 modified,15 modified_gmt,16 content_filtered,
// 17 parent,18 guid,19 menu_order,20 type,21 mime_type,22 comment_count

function splitRows(s) {
  const rows = [];
  let i = s.indexOf('INSERT INTO `wp_posts` VALUES');
  while (i !== -1) {
    i = s.indexOf('(', i);
    let depth = 0, inq = false, esc = false, row = '';
    for (; i < s.length; i++) {
      const c = s[i];
      if (inq) {
        row += c;
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === "'") inq = false;
      } else if (c === "'") { inq = true; row += c; }
      else if (c === '(') { if (depth > 0) row += c; depth++; }
      else if (c === ')') { depth--; if (depth === 0) { rows.push(row); row = ''; } else row += c; }
      else if (c === ';' && depth === 0) break;
      else if (depth > 0) row += c;
    }
    i = s.indexOf('INSERT INTO `wp_posts` VALUES', i);
  }
  return rows;
}

function splitFields(row) {
  const out = [];
  let cur = '', inq = false, esc = false;
  for (const c of row) {
    if (inq) {
      if (esc) { cur += c; esc = false; }
      else if (c === '\\') { esc = true; }        // Escape-Zeichen verwerfen
      else if (c === "'") inq = false;
      else cur += c;
    } else if (c === "'") inq = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

export function parseWpPosts(sql) {
  const rows = [];
  for (const raw of splitRows(sql)) {
    const f = splitFields(raw);
    if (f.length < 23) continue;
    rows.push({
      id: Number(f[0]),
      content: f[4],
      title: f[5],
      status: f[7],
      name: f[11],
      type: f[20],
    });
  }
  return rows;
}
```

- [ ] **Step 4: Test ausführen (erwartet PASS)**

Run: `npm test -- tests/sql-posts.test.ts`
Expected: PASS (2 Tests grün).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/sql-posts.mjs tests/sql-posts.test.ts
git commit -m "feat: SQL-Tokenizer für wp_posts mit Tests"
```

---

### Task 8: Enfold-Seitentexte extrahieren (Runner)

**Files:**
- Create: `scripts/extract-pages.mjs`

**Interfaces:**
- Consumes: `DB2094128_2026-06-08.sql.gz` (entpackt zur Laufzeit), `parseWpPosts`, `stripAvia`.
- Produces: Markdown-Dateien unter `src/content/pages/{de,en}/<slug>.md` für die V1-Seiten, mit Frontmatter `{ title, lang, slug }`.

- [ ] **Step 1: `scripts/extract-pages.mjs` implementieren**

```js
// Liest den gz-SQL-Dump, wählt die V1-Seiten per Post-ID und schreibt
// bereinigtes Markdown nach src/content/pages/{de,en}/.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { parseWpPosts } from './lib/sql-posts.mjs';
import { stripAvia } from './lib/strip-avia.mjs';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const DUMP = join(root, 'DB2094128_2026-06-08.sql.gz');
const DEST = join(root, 'src/content/pages');

// V1-Seiten: Post-ID -> {lang, slug}. IDs aus DB-Analyse 2026-07.
const TARGETS = {
  734:  { lang: 'de', slug: 'startseite' },
  3796: { lang: 'en', slug: 'home' },
  3255: { lang: 'de', slug: 'veo' },
  3850: { lang: 'en', slug: 'veo' },
  3263: { lang: 'de', slug: 'unternehmen' },
  3799: { lang: 'en', slug: 'company' },
  4171: { lang: 'de', slug: 'impressum' },
  4169: { lang: 'en', slug: 'legal-notice' },
  4164: { lang: 'de', slug: 'datenschutz' },
  4166: { lang: 'en', slug: 'data-privacy' },
};

const sql = gunzipSync(await readFile(DUMP)).toString('utf8');
const byId = new Map(parseWpPosts(sql).map((p) => [p.id, p]));

for (const lang of ['de', 'en']) {
  await rm(join(DEST, lang), { recursive: true, force: true });
  await mkdir(join(DEST, lang), { recursive: true });
}

let n = 0;
const missing = [];
for (const [id, meta] of Object.entries(TARGETS)) {
  const post = byId.get(Number(id));
  if (!post) { missing.push(id); continue; }
  const body = stripAvia(post.content);
  const fm = `---\ntitle: ${JSON.stringify(post.title)}\nlang: ${meta.lang}\nslug: ${JSON.stringify(meta.slug)}\n---\n\n`;
  await writeFile(join(DEST, meta.lang, `${meta.slug}.md`), fm + body + '\n', 'utf8');
  n++;
}
console.log(`[pages] geschrieben: ${n}/${Object.keys(TARGETS).length}`);
if (missing.length) { console.warn('[pages] fehlende IDs:', missing.join(', ')); process.exitCode = 1; }
```

- [ ] **Step 2: Runner ausführen und Ergebnis sichten**

Run: `npm run extract:pages`
Expected: `[pages] geschrieben: 10/10`, keine fehlenden IDs.
Danach `src/content/pages/de/veo.md` öffnen und kurz prüfen, dass verständlicher Text ohne `[av_…]`-Reste enthalten ist. (Redaktionelle Überarbeitung der teils veralteten Texte erfolgt separat durch den Auftraggeber.)

- [ ] **Step 3: Build verifizieren**

Run: `npm run build`
Expected: PASS – `pages`-Collection validiert gegen `pageSchema`.

- [ ] **Step 4: Commit**

```bash
git add scripts/extract-pages.mjs src/content/pages
git commit -m "feat: Enfold-Seitentexte (V1) aus DB-Dump extrahieren und bereinigen"
```

---

### Task 9: Gesamt-Verifikation Plan 1

**Files:**
- Modify: `package.json` (kombiniertes Migrations-Script)
- Create: `docs/CONTENT-PIPELINE.md`

**Interfaces:**
- Consumes: alle vorigen Tasks.
- Produces: ein Befehl `npm run migrate`, der News/Assets/Pages neu erzeugt; Kurz-Doku der Pipeline.

- [ ] **Step 1: Sammel-Script in `package.json` ergänzen**

Ergänze unter `scripts`:
```json
"migrate": "npm run import:news && npm run extract:assets && npm run extract:pages"
```

- [ ] **Step 2: Volle Pipeline + Tests + Build ausführen**

Run: `npm run migrate && npm test && npm run build`
Expected: News 50/44, Assets 8/8, Pages 10/10; alle Vitest-Tests grün; Build PASS.

- [ ] **Step 3: `docs/CONTENT-PIPELINE.md` schreiben**

```markdown
# Inhalts-Pipeline

Erzeugt die dateibasierten Inhalte aus den lokalen Backups.

- `npm run import:news`   – news-export/ → src/content/news/ (URLs normalisiert)
- `npm run extract:assets`– benötigte Uploads → src/assets/uploads/ (siehe src/assets/manifest.json)
- `npm run extract:pages` – DB-Dump → src/content/pages/ (Enfold-Shortcodes bereinigt)
- `npm run migrate`       – alle drei nacheinander

Quellen (nur lesen, nicht in Git): news-export/, wordpress-restore/, DB2094128_2026-06-08.sql.gz.
Ziele (in Git): src/content/, src/assets/.
```

- [ ] **Step 4: Commit & Push**

```bash
git add package.json docs/CONTENT-PIPELINE.md
git commit -m "chore: Sammel-Migrationsbefehl und Pipeline-Doku"
git push
```

---

## Self-Review

**Spec-Abdeckung (Plan 1-Teil):** Astro-Gerüst ✔ (T1), Design-System/Farben/lokale Fonts ✔ (T2), Content-Collections DE/EN ✔ (T3), News-Migration inkl. `trid`/Übersetzung + URL-Fix ✔ (T4), Medien selektiv ohne Plugin-Caches ✔ (T5), Enfold-Bereinigung ✔ (T6–T8), Build-Verifikation ✔ (T9). — **Bewusst NICHT in Plan 1** (→ Plan 2/3): Komponenten/Seiten-Rendering, mido-Inhalt (Material offen), Kontaktformular, Sprachumschalter-UI, SEO/Sitemap, Deployment. Diese sind in der Spec als eigene Bereiche bzw. offene Punkte markiert.

**Platzhalter-Scan:** Keine TODO/TBD in Code-Schritten; jeder Schritt enthält vollständigen Code oder exakte Befehle. Die redaktionelle Textüberarbeitung (T8) ist eine dokumentierte Auftraggeber-Aufgabe, kein Code-Platzhalter.

**Typ-Konsistenz:** `rewriteNews`, `stripAvia`, `parseWpPosts` sind in T4/T6/T7 definiert und werden in T4/T8 mit identischen Signaturen konsumiert. Schema-Namen (`newsSchema`/`productSchema`/`pageSchema`) konsistent zwischen `content-schemas.ts`, `content.config.ts` und Tests.

**Risiko-Hinweis:** Die Post-IDs in T8 (`TARGETS`) stammen aus der DB-Analyse vom 2026-07. Sollte der Runner „fehlende IDs" melden, sind die IDs vor dem Fortfahren gegen die aktuelle DB zu verifizieren (der Runner bricht dann mit Exit-Code 1 ab statt still Lücken zu erzeugen).
```
