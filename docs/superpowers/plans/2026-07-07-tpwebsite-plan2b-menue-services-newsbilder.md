# Teraport Website – Plan 2b: Menüstruktur, Services, toolkit/connect, News-Bilder

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neue Navigations-Struktur (Produkte-Dropdown mit mido/veo/toolkit/connect, dazu Services, Unternehmen, News, Kontakt), zwei neue Produktseiten (toolkit, connect) und eine Services-Seite aus dem Backup regenerieren, sowie die News-Beitragsbilder aus dem WordPress-Backup zuordnen und auf Karten + Detailseiten anzeigen.

**Architecture:** Baut auf Plan 1+2 auf. Neuer `wp_postmeta`-Parser (im bestehenden `scripts/lib/sql-posts.mjs`) liefert die Zuordnung News-`wp_id` → `_thumbnail_id` → `_wp_attached_file` → Bilddatei im Uploads-Backup. Ein neuer Runner `scripts/extract-news-images.mjs` kopiert die Bilder nach `public/assets/uploads/` (dort funktionieren auch die bereits in News-Bodies referenzierten `/assets/uploads/…`-URLs) und injiziert `image:` ins Frontmatter. toolkit/connect werden als weitere `products`-Einträge angelegt (die dynamischen `[product].astro`-Routen greifen automatisch). Services rendert drei zusätzlich extrahierte `pages`-Einträge als Abschnitte.

**Tech Stack:** wie bisher (Astro 5, TypeScript, Vitest).

## Global Constraints

- **Menü (oberste Ebene, exakt diese Reihenfolge):** Produkte (Dropdown) · Services · Unternehmen · News · Kontakt · Sprachumschalter. Dropdown-Einträge: mido, veo, toolkit, connect.
- **Produktnamen:** kleingeschrieben `mido`, `veo`, `toolkit`, `connect` (nie „veoCAST"; „DMU-Toolkit"/„DMU.Connect" nur als einmalige Herkunfts-Erwähnung im Fließtext erlaubt).
- **Neue Routen:** `/toolkit/`↔`/en/toolkit/`, `/connect/`↔`/en/connect/`, `/services/`↔`/en/services/` — zusätzlich zur bestehenden Tabelle.
- **Post-IDs (aus DB-Analyse, verifiziert publish):** DE Dienstleistung 3751, Engineering 3755, Softwareentwicklung 3761; EN Services 3802, Engineering 3806, Software development 3808. (toolkit/connect-Texte sind redaktionell in die products-Collection übernommen, IDs 3635/3846/3741/3848 dienten als Quelle.)
- **Tote Alt-Links entfernen:** Links auf `?page_id=…` und `teraport.de/docs/*.pdf` in den neu verfassten Produkt-Texten nicht übernehmen (Namen als Klartext); als redaktionelle Anpassung dokumentiert.
- **News-Bilder:** Ziel `public/assets/uploads/<originalpfad>`, Frontmatter-Feld `image: "/assets/uploads/<pfad>"` (optional im Schema). Fehlende Zuordnungen sind kein Fehler (ältere News haben kein Beitragsbild) — Zahlen werden geloggt, nichts wird still verschluckt.
- **Pipeline-Reihenfolge:** `migrate` = import:news → **extract:news-images** → extract:assets → extract:pages. Alle Runner idempotent; `wordpress-restore/` und der DB-Dump bleiben read-only/untracked.
- **Tests/Build:** TDD für reine Logik; nach jeder Task `npm run build` grün. Commits Deutsch (`feat:`/`fix:`/`test:`).

---

## Dateistruktur (neu/geändert)

```
scripts/lib/sql-posts.mjs        # + parseWpPostmeta (Refactor: Marker-Parameter)
scripts/extract-news-images.mjs  # NEU: Bilder zuordnen/kopieren + Frontmatter-Injektion
scripts/extract-pages.mjs        # + 6 TARGETS (Services-Seiten)
src/content-schemas.ts           # newsSchema + image (optional)
src/i18n/ui.ts                   # + nav.products, nav.services
src/i18n/routes.ts               # + 3 Routenpaare
src/components/Header.astro      # Dropdown-Navigation
src/components/NewsCard.astro    # optionales Bild
src/content/products/{de,en}/    # + toolkit.md, connect.md
src/pages/services.astro         # NEU (+ en/services.astro)
src/pages/news/[slug].astro      # Bild auf Detailseite (+ en)
src/pages/index.astro            # NewsCard erhält image-Prop (+ en)
public/assets/uploads/           # ZIEL der News-Bilder (in Git)
tests/sql-posts.test.ts          # + parseWpPostmeta-Tests
tests/i18n-routes.test.ts        # + neue Paare
tests/content-schema.test.ts     # + image optional
```

---

### Task 1: `parseWpPostmeta` (Parser-Erweiterung)

**Files:**
- Modify: `scripts/lib/sql-posts.mjs`
- Test: `tests/sql-posts.test.ts` (erweitern)

**Interfaces:**
- Consumes: SQL-Text des Dumps.
- Produces: `parseWpPostmeta(sql): Array<{ postId: number, key: string, value: string }>` (wp_postmeta-Spalten: meta_id, post_id, meta_key, meta_value). Bestehendes `parseWpPosts` bleibt unverändert nutzbar (Tests bleiben grün).

- [ ] **Step 1: Failing test ergänzen (an `tests/sql-posts.test.ts` anhängen)**

```ts
import { parseWpPostmeta } from '../scripts/lib/sql-posts.mjs';

describe('parseWpPostmeta', () => {
  const sql =
    "INSERT INTO `wp_postmeta` VALUES (1,6875,'_thumbnail_id','6876'),(2,6876,'_wp_attached_file','2023/06/mido_expo.jpg');" +
    "INSERT INTO `wp_postmeta` VALUES (3,42,'note','It\\'s a (test), really');";

  it('parst postId, key und value über mehrere INSERTs', () => {
    const rows = parseWpPostmeta(sql);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ postId: 6875, key: '_thumbnail_id', value: '6876' });
    expect(rows[1]).toEqual({ postId: 6876, key: '_wp_attached_file', value: '2023/06/mido_expo.jpg' });
  });

  it('behandelt Quotes/Kommas/Klammern im Wert korrekt', () => {
    const rows = parseWpPostmeta(sql);
    expect(rows[2]).toEqual({ postId: 42, key: 'note', value: "It's a (test), really" });
  });
});
```

- [ ] **Step 2: Test ausführen (erwartet FAIL: Export fehlt)**

Run: `npm test -- tests/sql-posts.test.ts`
Expected: FAIL – `parseWpPostmeta` ist nicht exportiert.

- [ ] **Step 3: `sql-posts.mjs` erweitern**

`splitRows` bekommt einen Marker-Parameter (bestehende Aufrufe funktional unverändert):

```js
function splitRows(s, marker = 'INSERT INTO `wp_posts` VALUES') {
  const rows = [];
  let i = s.indexOf(marker);
  // …Rumpf unverändert, nur beide indexOf-Aufrufe nutzen `marker`…
```

Neu am Dateiende:

```js
export function parseWpPostmeta(sql) {
  const rows = [];
  for (const raw of splitRows(sql, 'INSERT INTO `wp_postmeta` VALUES')) {
    const f = splitFields(raw);
    if (f.length < 4) continue;
    rows.push({ postId: Number(f[1]), key: f[2], value: f[3] });
  }
  return rows;
}
```

- [ ] **Step 4: Tests ausführen (erwartet PASS, inkl. aller Alt-Tests)**

Run: `npm test -- tests/sql-posts.test.ts && npm test`
Expected: sql-posts 7 Tests grün; volle Suite grün (32 + 2 neue = 34).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/sql-posts.mjs tests/sql-posts.test.ts
git commit -m "feat: wp_postmeta-Parser für Beitragsbild-Zuordnung"
```

---

### Task 2: Routen & UI-Strings erweitern

**Files:**
- Modify: `src/i18n/routes.ts`, `src/i18n/ui.ts`
- Test: `tests/i18n-routes.test.ts` (erweitern)

- [ ] **Step 1: Failing test ergänzen**

In `tests/i18n-routes.test.ts` im `altPath`-describe ergänzen:

```ts
  it('mappt die neuen Produkt-/Service-Routen', () => {
    expect(altPath('/toolkit/')).toBe('/en/toolkit/');
    expect(altPath('/connect/')).toBe('/en/connect/');
    expect(altPath('/en/services/')).toBe('/services/');
  });
```

und im `t`-describe:

```ts
  it('kennt die neuen Nav-Strings', () => {
    expect(t('de', 'nav.products')).toBe('Produkte');
    expect(t('en', 'nav.products')).toBe('Products');
    expect(t('de', 'nav.services')).toBe('Services');
  });
```

Run: `npm test -- tests/i18n-routes.test.ts` → Expected: FAIL.

- [ ] **Step 2: `routes.ts` — drei Paare ergänzen (nach dem `/veo/`-Paar)**

```ts
  { de: '/toolkit/', en: '/en/toolkit/' },
  { de: '/connect/', en: '/en/connect/' },
  { de: '/services/', en: '/en/services/' },
```

- [ ] **Step 3: `ui.ts` — Strings ergänzen (in beiden Sprachblöcken, vor `nav.company`)**

```ts
    'nav.products': 'Produkte',   // en: 'Products'
    'nav.services': 'Services',   // en: 'Services'
```

- [ ] **Step 4: Tests (erwartet PASS) und Commit**

Run: `npm test` → alle grün (36).

```bash
git add src/i18n tests/i18n-routes.test.ts
git commit -m "feat: Routen und Nav-Strings für toolkit, connect und Services"
```

---

### Task 3: Services-Quellseiten extrahieren

**Files:**
- Modify: `scripts/extract-pages.mjs` (TARGETS erweitern)

- [ ] **Step 1: TARGETS ergänzen (nach dem `en/company`-Eintrag einfügen)**

```js
  3751: { lang: 'de', slug: 'dienstleistung' },
  3755: { lang: 'de', slug: 'engineering' },
  3761: { lang: 'de', slug: 'softwareentwicklung' },
  3802: { lang: 'en', slug: 'services' },
  3806: { lang: 'en', slug: 'engineering' },
  3808: { lang: 'en', slug: 'software-development' },
```

- [ ] **Step 2: Runner ausführen und sichten**

Run: `npm run extract:pages`
Expected: `[pages] geschrieben: 16/16`, keine fehlenden IDs. `src/content/pages/de/engineering.md` stichprobenartig öffnen: lesbarer Text, keine `[av_`-Reste.

- [ ] **Step 3: Build + Commit**

Run: `npm run build` → PASS.

```bash
git add scripts/extract-pages.mjs src/content/pages
git commit -m "feat: Services-Quellseiten (Dienstleistung/Engineering/Softwareentwicklung) extrahieren"
```

---

### Task 4: Produkt-Inhalte toolkit & connect

**Files:**
- Create: `src/content/products/de/toolkit.md`, `src/content/products/en/toolkit.md`
- Create: `src/content/products/de/connect.md`, `src/content/products/en/connect.md`

Texte basieren auf den DB-Seiten 3635/3846 (DMU-Toolkit) und 3741/3848 (DMU.Connect); Produktname kleingeschrieben, tote Alt-Links entfernt (redaktionelle Anpassung, vom Auftraggeber gegenzulesen).

- [ ] **Step 1: `src/content/products/de/toolkit.md`**

```markdown
---
title: "toolkit"
lang: de
slug: "toolkit"
order: 3
teaser: "Modularer Software-Baukasten für DMU – flexibel, neutral, hochgradig automatisierbar."
---

Einzelne Module aus dem **toolkit** (DMU-Toolkit) sind Bestandteil jeder Teraport-Software-Lösung: von der standardisierten Einstiegslösung für einen Zulieferer mit zehn Anwendern bis zur Individuallösung für Automobilkonzerne mit mehreren tausend Anwendern – für Konstrukteure und Designer ebenso wie für Montageplaner und Service-Bereiche, mal gekoppelt an ein CAD- oder PDM-System, mal als eigenständige Lösung.

Die Vielzahl der vorhandenen Datenschnittstellen ermöglicht das Verarbeiten von Daten der unterschiedlichen Produktentwicklungsumgebungen (CATIA, Creo, NX, SolidWorks u. v. m.).

## Modular und flexibel

Das toolkit ist ein modularer und höchst flexibler Software-Baukasten. Die Module können einzeln oder kombiniert an verschiedenen Stellen des Engineering-Prozesses eingesetzt werden – maßgeschneiderte Lösungen für kundenspezifische Anforderungen.

## Neutral und offen

Die Module verarbeiten alle in der Industrie gängigen Datenformate. Damit ist die Offenheit zu verschiedenen Engineering-Systemen (z. B. PDM, CAD oder VR) gegeben. Auch die Integration der Berechnungsergebnisse in die bestehende Systemlandschaft ist dank konsequenter Nutzung von Standards schnell, einfach und kosteneffizient.

## Leistungsstark und automatisiert

Leistungsfähige, stabile und methodisch innovative Algorithmen gewährleisten höchste Performance, selbst auf Standard-Hardware. Alle Module können auch im Batch betrieben werden und erleichtern so die Verarbeitung von 3D-Massendaten – auf Servern bis hin zu Rechen-Clustern. Nahezu alle DMU-Prozesse lassen sich vollständig automatisieren.

## Module

Eine detaillierte Beschreibung aller verfügbaren Module stellen wir gern auf Anfrage zur Verfügung – [Kontakt aufnehmen](/kontakt/).
```

- [ ] **Step 2: `src/content/products/en/toolkit.md`**

```markdown
---
title: "toolkit"
lang: en
slug: "toolkit"
order: 3
teaser: "Modular DMU software toolkit – flexible, neutral, highly automatable."
---

Individual modules of the **toolkit** (DMU-Toolkit) are part of every Teraport software solution: from the standard entry-level solution for a supplier with ten users to custom-built solutions for automotive companies with several thousand users – for engineers and designers as well as for assembly planners and service areas, sometimes coupled with a CAD or PDM system, sometimes as a stand-alone solution.

A multitude of available data interfaces allows processing data from various product development environments (CATIA, Creo, NX, SolidWorks and many more).

## Modular and flexible

The toolkit is highly flexible, modular software. The modules can be used individually or in combination at various points in the engineering process – tailor-made solutions for specific customer requirements.

## Neutral and open

The modules process all common data formats in the industry. This provides openness towards various engineering systems (e.g. PDM, CAD or VR). Integration of calculation results into the customer's existing system landscape is fast, simple and cost-efficient thanks to consistent use of standards.

## Powerful and automated

Powerful, stable and methodically innovative algorithms ensure the highest performance, even on standard hardware. All modules can be operated in batch mode, facilitating the processing of 3D mass data – on servers up to compute clusters. Virtually all DMU processes can be fully automated.

## Modules

We are happy to provide a detailed description of all available modules on request – [get in touch](/en/contact/).
```

- [ ] **Step 3: `src/content/products/de/connect.md`**

```markdown
---
title: "connect"
lang: de
slug: "connect"
order: 4
teaser: "Wizard-gesteuerte Workflow-Oberfläche für automatisierte Berechnungen und Simulationen."
---

**connect** (DMU.Connect) ist die Workflow-Oberfläche von Teraport. Das Konzept ist so einfach wie gut: Berechnungen und Simulationen, die nicht zwangsläufig von einer 3D-Nutzerinteraktion abhängig sind, werden in einer Wizard-gesteuerten Oberfläche definiert. Ähnlich einem Installationsassistenten führt connect den Benutzer Schritt für Schritt durch die Berechnungsdefinition.

Der Vorteil: Sobald eine Berechnung definiert und als „Job" gespeichert wurde, lässt sie sich über ein Jobmanagement-System automatisiert und regelgesteuert abrufen. Eine nächtliche Berechnung im Hintergrund auf Basis stets aktueller Daten bindet weder Rechner noch Nutzer. Das Kopieren und Modifizieren bestehender Berechnungen ermöglicht es, schnell unterschiedliche Alternativen zu simulieren.

## Integrierte Workflows

- Ein- und Ausbausimulation (Pro.PathFinder und Pro.PathSmoother)
- Dynamische Kollisionsprüfung (Pro.PathInspector)
- Generieren von Hüllgeometrie über Bewegungsvorgänge (Pro.PathFreezer)
- Datenaufbereitung und -reduzierung (Pro.DataReducer und Pro.DataPatcher)
- Berechnung geometrischer Differenzen (Pro.DiffAnalyzer)
- Analyse von Flüssigkeitsvolumen, z. B. Tank oder Getriebeöl (Pro.FluidAnalyzer)
- Filtern von Bauteilstrukturen nach geometrischen Aspekten, z. B. Fahrzeuginnenraum (Pro.ShellFilter)
- Berechnung von geometrischem Offset von Bauteilen (Pro.OffsetBuilder)
```

- [ ] **Step 4: `src/content/products/en/connect.md`**

```markdown
---
title: "connect"
lang: en
slug: "connect"
order: 4
teaser: "Wizard-driven workflow interface for automated calculations and simulations."
---

**connect** (DMU.Connect) is Teraport's workflow interface. The concept is as simple as it is effective: calculations and simulations that do not necessarily depend on 3D user interaction are defined in a wizard-driven interface. Much like an installation wizard, connect guides the user step by step through the calculation definition.

The advantage: once a calculation is defined and stored as a "job", it can be executed automatically and rule-based via a job management system. An overnight background calculation based on always up-to-date data ties up neither computers nor users. Copying and modifying existing calculations makes it easy to quickly simulate different alternatives.

## Integrated workflows

- Installation and removal simulation (Pro.PathFinder and Pro.PathSmoother)
- Dynamic collision checking (Pro.PathInspector)
- Generating envelope geometry from motion sequences (Pro.PathFreezer)
- Data preparation and reduction (Pro.DataReducer and Pro.DataPatcher)
- Calculation of geometric differences (Pro.DiffAnalyzer)
- Analysis of fluid volumes, e.g. tank or gear oil (Pro.FluidAnalyzer)
- Filtering component structures by geometric aspects, e.g. vehicle interior (Pro.ShellFilter)
- Calculation of geometric offset of components (Pro.OffsetBuilder)
```

- [ ] **Step 5: Build + Verifikation + Commit**

Run: `npm run build && ls dist/toolkit/index.html dist/connect/index.html dist/en/toolkit/index.html dist/en/connect/index.html`
Expected: Build PASS; alle 4 Dateien vorhanden (dynamische `[product].astro`-Routen greifen automatisch).

```bash
git add src/content/products
git commit -m "feat: Produkt-Inhalte toolkit und connect (de/en) aus Backup regeneriert"
```

---

### Task 5: Header-Dropdown + Services-Seiten

**Files:**
- Modify: `src/components/Header.astro`
- Create: `src/pages/services.astro`, `src/pages/en/services.astro`

- [ ] **Step 1: `Header.astro` — Navigation ersetzen**

Kompletter neuer `<nav>`-Block + Styles (Rest der Datei unverändert):

```astro
    <nav aria-label="Hauptnavigation">
      <div class="dropdown">
        <button class="drop-trigger" type="button" aria-haspopup="true">{t(lang, 'nav.products')} ▾</button>
        <div class="menu">
          <a href={p('/mido/', '/en/mido/')}>mido</a>
          <a href={p('/veo/', '/en/veo/')}>veo</a>
          <a href={p('/toolkit/', '/en/toolkit/')}>toolkit</a>
          <a href={p('/connect/', '/en/connect/')}>connect</a>
        </div>
      </div>
      <a href={p('/services/', '/en/services/')}>{t(lang, 'nav.services')}</a>
      <a href={p('/unternehmen/', '/en/company/')}>{t(lang, 'nav.company')}</a>
      <a href={p('/news/', '/en/news/')}>{t(lang, 'nav.news')}</a>
      <a href={p('/kontakt/', '/en/contact/')} class="cta">{t(lang, 'nav.contact')}</a>
      <a href={altHref} class="lang" rel="alternate" hreflang={lang === 'de' ? 'en' : 'de'}>
        {lang === 'de' ? 'EN' : 'DE'}
      </a>
    </nav>
```

Styles ergänzen (im bestehenden `<style>`-Block):

```css
  .dropdown { position: relative; }
  .drop-trigger {
    background: none; border: 0; cursor: pointer;
    font: inherit; font-weight: 600; font-size: 0.95rem; color: var(--tp-ink); padding: 0;
  }
  .drop-trigger:hover { color: var(--tp-blue); }
  .menu {
    display: none; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
    background: var(--tp-white); border: 1px solid #e5e9ef; border-radius: 8px;
    padding: 0.5rem; min-width: 9rem; box-shadow: 0 8px 24px rgb(18 35 58 / 12%); z-index: 20;
  }
  .dropdown:hover .menu, .dropdown:focus-within .menu { display: grid; gap: 0.15rem; }
  .menu a { padding: 0.4rem 0.7rem; border-radius: 6px; }
  .menu a:hover { background: var(--tp-bg); }
```

- [ ] **Step 2: `src/pages/services.astro`**

```astro
---
import { getEntry, render } from 'astro:content';
import SiteLayout from '../layouts/SiteLayout.astro';

const ids = ['de/dienstleistung', 'de/engineering', 'de/softwareentwicklung'];
const sections = [];
for (const id of ids) {
  const entry = await getEntry('pages', id);
  if (!entry) throw new Error(`Content pages/${id} fehlt – npm run migrate ausführen.`);
  const { Content } = await render(entry);
  sections.push(Content);
}
---
<SiteLayout title="Services – Teraport" lang="de" altHref="/en/services/">
  <article class="tp-container prose">
    <h1>Services</h1>
    {sections.map((Content) => <section><Content /></section>)}
  </article>
</SiteLayout>
```

- [ ] **Step 3: `src/pages/en/services.astro`** — identisch mit `ids = ['en/services', 'en/engineering', 'en/software-development']`, `lang="en"`, `altHref="/services/"`, Import `../../layouts/SiteLayout.astro`.

- [ ] **Step 4: Build + Verifikation + Commit**

Run: `npm run build && ls dist/services/index.html dist/en/services/index.html`
Expected: PASS; beide Dateien vorhanden; `dist/index.html` enthält `drop-trigger` (Dropdown gerendert).

```bash
git add src/components/Header.astro src/pages/services.astro src/pages/en/services.astro
git commit -m "feat: Produkte-Dropdown in der Navigation und Services-Seiten (de/en)"
```

---

### Task 6: News-Bilder zuordnen und anzeigen

**Files:**
- Modify: `src/content-schemas.ts` (+ `image`), `tests/content-schema.test.ts`
- Create: `scripts/extract-news-images.mjs`
- Modify: `package.json` (Script + migrate-Kette)
- Modify: `src/components/NewsCard.astro`, `src/pages/news/[slug].astro`, `src/pages/en/news/[slug].astro`, `src/pages/index.astro`, `src/pages/en/index.astro`, `src/pages/news/index.astro`, `src/pages/en/news/index.astro`

- [ ] **Step 1: Failing test — `image` optional im newsSchema**

In `tests/content-schema.test.ts` im newsSchema-describe ergänzen:

```ts
  it('akzeptiert ein optionales image-Feld', () => {
    const parsed = newsSchema.parse({
      title: 'x', date: '2025-01-01', lang: 'de', slug: 's',
      image: '/assets/uploads/2023/06/foo.jpg',
    });
    expect(parsed.image).toBe('/assets/uploads/2023/06/foo.jpg');
  });
```

Run: `npm test -- tests/content-schema.test.ts` → FAIL (unknown key wird zwar von Zod ignoriert — daher schlägt `parsed.image` als `undefined` fehl).

- [ ] **Step 2: `src/content-schemas.ts` — im `newsSchema` nach `translation` ergänzen**

```ts
  image: z.string().optional(),
```

Run: Test → PASS.

- [ ] **Step 3: `scripts/extract-news-images.mjs` erstellen**

```js
// Ordnet News-Beiträgen ihr WordPress-Beitragsbild zu:
// wp_id -> _thumbnail_id -> _wp_attached_file -> Datei aus dem Uploads-Backup.
// Kopiert Bilder nach public/assets/uploads/ und injiziert `image:` ins Frontmatter.
// Kopiert außerdem alle in News-Bodies referenzierten /assets/uploads/-Dateien.
import { readdir, readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { parseWpPostmeta } from './lib/sql-posts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DUMP = join(root, 'DB2094128_2026-06-08.sql.gz');
const NEWS = join(root, 'src/content/news');
const UPLOADS = join(root, 'wordpress-restore/wp-content/uploads');
const DEST = join(root, 'public/assets/uploads');

const sql = gunzipSync(await readFile(DUMP)).toString('utf8');
const thumbOf = new Map(); // post_id -> attachment_id
const fileOf = new Map();  // attachment_id -> relativer Pfad
for (const m of parseWpPostmeta(sql)) {
  if (m.key === '_thumbnail_id') thumbOf.set(m.postId, Number(m.value));
  else if (m.key === '_wp_attached_file') fileOf.set(m.postId, m.value);
}

async function copyUpload(rel) {
  const from = join(UPLOADS, rel);
  const to = join(DEST, rel);
  try { await access(from); } catch { return false; }
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
  return true;
}

let withImage = 0, without = 0, missing = 0, bodyCopied = 0;
for (const lang of ['de', 'en']) {
  const dir = join(NEWS, lang);
  for (const f of (await readdir(dir)).filter((x) => x.endsWith('.md'))) {
    const p = join(dir, f);
    let text = await readFile(p, 'utf8');

    // Body-Bilder nach public/ kopieren (Referenzen aus Plan 1)
    for (const m of text.matchAll(/\/assets\/uploads\/([^\s)"']+)/g)) {
      if (await copyUpload(m[1])) bodyCopied++;
    }

    const wp = text.match(/^wp_id:\s*(\d+)\s*$/m);
    const attId = wp ? thumbOf.get(Number(wp[1])) : undefined;
    const rel = attId ? fileOf.get(attId) : undefined;
    if (!rel) { without++; continue; }
    if (!(await copyUpload(rel))) { missing++; console.warn(`[news-images] Datei fehlt im Backup: ${rel}`); continue; }

    const imgLine = `image: "/assets/uploads/${rel}"`;
    if (/^image:/m.test(text)) text = text.replace(/^image:.*$/m, imgLine);
    else text = text.replace(/\n---\n/, `\n${imgLine}\n---\n`);
    await writeFile(p, text, 'utf8');
    withImage++;
  }
}
console.log(`[news-images] mit Bild: ${withImage}, ohne Beitragsbild: ${without}, Datei fehlt: ${missing}, Body-Bilder: ${bodyCopied}`);
if (missing > 0) process.exitCode = 1;
```

- [ ] **Step 4: `package.json` — Script ergänzen und `migrate` erweitern**

```json
"extract:news-images": "node scripts/extract-news-images.mjs",
"migrate": "npm run import:news && npm run extract:news-images && npm run extract:assets && npm run extract:pages"
```

- [ ] **Step 5: Runner ausführen**

Run: `npm run extract:news-images`
Expected: Ausgabe `[news-images] mit Bild: N, ohne Beitragsbild: M, …` mit N+M = 94, `Datei fehlt: 0` (Exit 0). N sollte deutlich > 0 sein (Dump enthält 108 `_thumbnail_id`-Einträge). Stichprobe: eine aktuelle News-Datei öffnen und `image:`-Zeile prüfen.

- [ ] **Step 6: `NewsCard.astro` — optionales Bild**

```astro
---
import type { Lang } from '../i18n/ui.ts';
interface Props { title: string; date: Date; href: string; lang: Lang; image?: string; }
const { title, date, href, lang, image } = Astro.props;
const fmt = date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
---
<a class="card" href={href}>
  {image && <img class="thumb" src={image} alt="" loading="lazy" />}
  <div class="body">
    <time datetime={date.toISOString().slice(0, 10)}>{fmt}</time>
    <h3>{title}</h3>
  </div>
</a>
<style>
  .card { display: block; background: var(--tp-white); border: 1px solid #e5e9ef; border-radius: 10px; overflow: hidden; text-decoration: none; color: var(--tp-ink); transition: border-color 0.15s ease; }
  .card:hover { border-color: var(--tp-blue-light); }
  .thumb { width: 100%; aspect-ratio: 16 / 7; object-fit: cover; }
  .body { padding: 1.1rem 1.25rem; }
  time { color: var(--tp-gray); font-size: 0.85rem; }
  h3 { margin: 0.3rem 0 0; font-size: 1.05rem; line-height: 1.35; }
</style>
```

- [ ] **Step 7: Aufrufer erweitern (image-Prop durchreichen)**

In `src/pages/index.astro`, `src/pages/en/index.astro`, `src/pages/news/index.astro`, `src/pages/en/news/index.astro` bei jedem `<NewsCard …>` ergänzen: `image={n.data.image}`.

- [ ] **Step 8: News-Detailseiten — Bild nach `<h1>` rendern**

In `src/pages/news/[slug].astro` und `src/pages/en/news/[slug].astro` direkt nach der `<h1>`-Zeile:

```astro
    {entry.data.image && <img class="hero-img" src={entry.data.image} alt="" loading="lazy" />}
```

und im (ggf. neuen) `<style>`-Block der beiden Dateien:

```css
  .hero-img { width: 100%; border-radius: 10px; margin-block: 1rem; }
```

- [ ] **Step 9: Volle Verifikation + Commit**

Run: `npm test && npm run build`
Expected: Suite grün (37); Build PASS; `dist/assets/uploads/` enthält die kopierten Bilder; eine News-Detailseite mit Bild enthält `hero-img`.

```bash
git add src/content-schemas.ts tests/content-schema.test.ts scripts/extract-news-images.mjs package.json src/components/NewsCard.astro src/pages src/content/news public/assets
git commit -m "feat: News-Beitragsbilder aus Backup zuordnen und anzeigen"
```

---

### Task 7: Gesamt-Verifikation & Push

- [ ] **Step 1: Pipeline-Idempotenz + alle Routen prüfen**

Run:
```bash
npm run migrate && git status --short -- src/content src/assets public | head -5
npm test && npm run build && for f in \
  index.html en/index.html \
  mido/index.html veo/index.html toolkit/index.html connect/index.html \
  en/mido/index.html en/veo/index.html en/toolkit/index.html en/connect/index.html \
  services/index.html en/services/index.html \
  unternehmen/index.html en/company/index.html \
  news/index.html en/news/index.html kontakt/index.html en/contact/index.html \
  impressum/index.html datenschutz/index.html en/legal-notice/index.html en/data-privacy/index.html \
; do test -f "dist/$f" && echo "OK  $f" || echo "FEHLT $f"; done
```
Expected: `git status` nach migrate leer für die Content-Pfade (idempotent); Tests grün; 22 × `OK`.

- [ ] **Step 2: Push**

```bash
git push
```

---

## Self-Review

**Abdeckung der Anforderung:** Menü-Ebene 1 (Produkte-Dropdown/Services/Unternehmen/News/Kontakt) ✔ T5; Dropdown-Einträge mido/veo/toolkit/connect ✔ T5; toolkit/connect-Inhalte aus Backup ✔ T4 (Quellen 3635/3846/3741/3848); Services-Inhalt aus Backup ✔ T3+T5; News-Bilder inkl. Zuordnung ✔ T1+T6 (Mapping über `_thumbnail_id`/`_wp_attached_file`, verifiziert: 108 Thumbnail-Einträge im Dump).

**Platzhalter-Scan:** Alle Code-Steps vollständig; T5 Step 3 und T6 Step 7 verweisen auf vollständig gezeigte Muster mit exakt benannten Abweichungen.

**Typ-Konsistenz:** `parseWpPostmeta`-Shape (T1) = Verbrauch in T6; `image`-Feld (Schema T6 Step 2) = Frontmatter-Injektion (Step 3) = `NewsCard`-Prop (Step 6) = Aufrufer (Step 7/8); neue Routen (T2) = Header-Links (T5) = Seiten-Dateien (T4 dynamisch, T5 statisch).

**Risiken:** (1) Nicht jede News hat ein Beitragsbild (ältere Beiträge) — gewollt, wird geloggt. (2) `public/assets/uploads` erhöht Repo-Größe um die Bilddateien (~einige MB) — akzeptiert, da Medien ohnehin versioniert werden sollen. (3) Dropdown per hover/focus-within: auf Touch öffnet der Button-Fokus das Menü; vollwertige Mobile-Navigation ist Plan-3-Feinschliff.
