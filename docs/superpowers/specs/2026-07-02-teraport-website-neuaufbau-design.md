# Teraport Website – Neuaufbau (Design / Spezifikation)

**Datum:** 2026-07-02
**Kontext:** Die bisherige WordPress-Website von Teraport wurde gehackt. Statt die kompromittierte Installation wiederherzustellen, wird die Seite als sichere, statische Website neu aufgebaut. Als Quellmaterial liegen vor: DB-Dump (`DB2094128_2026-06-08.sql.gz`), Uploads-Backup (`backup_2025-08-08-…-uploads.zip`, entpackt unter `wordpress-restore/wp-content/uploads`) sowie ein bereits gezogener News-Export als Markdown (`news-export/`, 50 DE + 44 EN).

## 1. Ziel & Leitentscheidungen

- **Sicherheit zuerst:** Rein statische Ausgabe (keine Datenbank, kein Login, kein PHP) → praktisch keine Server-Angriffsfläche. Adressiert direkt die Ursache des Hacks.
- **Technologie:** [Astro](https://astro.build) (Static-Site-Generator) mit dateibasierten Inhalten (Markdown/Content Collections), eingebautem i18n.
- **Pflege:** Entwickler-/dateibasiert. Kein CMS in V1.
- **Design:** Frisches, modernes, klares Corporate-Design (Richtung „B") in Blau/Weiß, abgeleitet aus dem bestehenden Logo. Kein 1:1-Nachbau des alten Auftritts.
- **Sprachen:** Zweisprachig DE/EN, gespiegelte Struktur.
- **Umfang:** Phasenweise. Diese Spec beschreibt **V1 (Kern)**; weitere/alte Produktseiten folgen in späteren Phasen.

## 2. Umfang V1

Je Sprache (DE/EN):

| Seite | Inhaltsquelle |
|---|---|
| Startseite | Neu getextet (aus Home-Seite + Produkt-Highlights) |
| mido (Produkt) | Aus News-Copy + zu lieferndem Material |
| veo (Produkt) | Aus alter veo-Seite (Enfold, bereinigt) + vorhandenen Bildern |
| Unternehmen | Aus „Unternehmen / Management / Standort / Referenzen" (bereinigt) |
| News (Übersicht + Detail) | Vorhandener Markdown-Export (94 Beiträge) |
| Kontakt | Adresse München-Haidhausen + Kontaktformular |
| Impressum | Aus bestehender Seite |
| Datenschutz / AGB | Aus bestehender Seite |

**Produktbezeichnung:** Das Produkt heißt durchgängig **veo** (nicht „veoCAST").

**Nicht in V1 (spätere Phasen):** DMU-Toolkit, DMU.Connect, ADV, Pro.-Suite (DataReducer, DiffAnalyzer, FluidAnalyzer, OffsetBuilder, PathFinder, PathFreezer, PathInspector), separate Bereiche Engineering/Softwareentwicklung, Whitepaper, Karriere.

## 3. Architektur & Projektstruktur

```
tpwebsite-neu/
├── src/
│   ├── content/
│   │   ├── news/{de,en}/*.md       # News-Export (bereinigt)
│   │   └── products/{de,en}/*.md   # mido, veo
│   ├── pages/
│   │   ├── de/…  und  en/…         # Start, Unternehmen, Kontakt, Rechtliches
│   ├── layouts/                    # Grundgerüst (Header/Footer/Sprache)
│   ├── components/                 # Hero, Nav, Produkt-Kachel, News-Karte, …
│   └── i18n/                       # UI-/Menü-Strings
├── public/                         # Medien (bereinigt), Logo, Fonts
└── astro.config.mjs
```

**Prinzipien:** Inhalt (Markdown) strikt getrennt von Darstellung (Komponenten). Jede Komponente/Seite hat eine klare, testbare Aufgabe. DE/EN über gespiegelte Verzeichnisse + zentrale i18n-Strings; jede Seite kennt ihre Übersetzung (News tragen `trid`/`translation` im Frontmatter).

## 4. Design-System

- **Farben** (aus Logo abgeleitet): Primär-Blau `#2d6cb2`, Hell-Blau `#a9c7e0`, Neutral-Grau `#8a9299`, Text-Dunkel `#12233a`, Hintergründe Weiß / `#f5f7fa`. Footer dunkelblau mit weißer Logo-Variante (`TP_340_trans_white.png`).
- **Typografie:** Serifenlose Web-Schrift (z. B. Inter oder Source Sans), **lokal eingebunden** (kein Google-Fonts-CDN → DSGVO-konform). Klare Hierarchie, großzügige Zeilenhöhe.
- **Komponenten:** Header/Nav mit Sprachumschalter, Hero, Produkt-Kachel, Nutzen-Leiste, News-Karte, Referenz-/Partner-Logoleiste, Footer, Buttons, Kontaktformular.
- **Homepage-Aufbau (Variante A):** Hero (Headline + CTA) → mido & veo als gleichwertige Kacheln → Nutzen-Leiste → aktuelle News → Kontakt-CTA.
- **Barrierefreiheit/Performance:** semantisches HTML, ausreichende Kontraste, Mobile-first responsive, optimierte Bilder (Astro `<Image>`), keine externen Tracker außer optionalem DSGVO-konformem Consent.

## 5. Inhalts-Pipeline (Migration aus Backup)

- **News:** 94 Markdown-Dateien → Astro Content Collection. Bild-Referenzen auf lokale Assets umbiegen; DE/EN über `trid`/`translation` verknüpfen. (Hinweis: DB-Dump vom 2026-06 zeigt 33 veröffentlichte Posts; der Export enthält 94 Dateien inkl. Übersetzungen/älterer Stände — beim Import wird auf konsistente, veröffentlichte Beiträge normalisiert.)
- **Seiten (Enfold):** Textinhalte der relevanten Seiten per Script aus der DB extrahieren und `av_`-Shortcodes zu sauberem Markdown/Text **bereinigen**. mido neu texten.
- **Redaktionelle Prüfung:** Alte Texte sind teils veraltet und werden vom Auftraggeber gegengelesen/aktualisiert.

## 6. Medien

- Nur benötigte Assets aus `wp-content/uploads` übernehmen: Logo (`TP_340_trans*.png`), veo-Produktbilder, Referenz-/Partnerlogos (KIT, Siemens Partner, ZIM, cadcam, …), News-Bilder.
- **Nicht** übernehmen: Plugin-Caches (`cache`, `wpdm-*`, `dynamic_avia`, `omgf`, `wpcf7_*`, `complianz`).
- Groß-/Kleinschreibungs-Konflikte (`_CASE-KONFLIKTE_uppercase`) einzeln prüfen und auflösen.

## 7. Kontaktformular

Statische Seite → Versand über serverlosen Endpoint (z. B. Formspree oder eigene Function) mit Fallback auf strukturierten `mailto:`-Link. Konkrete Wahl bei der Umsetzung, abhängig vom Hosting. Kontakt-Zieladresse und Datenschutzhinweis sind vorzusehen.

## 8. Build, Deployment & Qualität

- **Build:** `astro build` → statisches HTML/CSS/JS.
- **Deployment:** Hostbar auf jedem Webspace/CDN (Netlify, Cloudflare Pages, eigener Server). Ziel wird separat festgelegt.
- **Qualitätskriterien (Definition of Done für V1):**
  - Build läuft fehlerfrei.
  - Alle V1-Seiten in **DE und EN** vorhanden und verlinkt (Sprachumschalter funktioniert).
  - Keine toten Links / fehlenden Bilder (Link-Check).
  - Responsive auf Mobil und Desktop (Sichtprüfung).
  - Lighthouse: gute Werte für Performance und Accessibility.
  - Keine externen Tracker/CDN-Abhängigkeiten ohne Consent (DSGVO).

## 9. Offene Punkte (außerhalb dieser Spec zu liefern/entscheiden)

1. mido-Material (Texte/Bilder).
2. Optional: saubere Vektor-Version des Logos (SVG).
3. Deployment-Ziel.
4. Formular-Dienst.

## 10. Spätere Phasen (nicht V1)

- Weitere/historische Produktseiten (DMU-Toolkit, DMU.Connect, ADV, Pro.-Suite).
- Bereiche Engineering / Softwareentwicklung, Whitepaper, Karriere.
- Optional später: Git-basiertes Redaktions-CMS (z. B. Decap/Sveltia), falls nicht-technische Pflege gewünscht wird.
