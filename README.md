# Teraport Website – Neuaufbau

Neuaufbau der Teraport-Website als **sichere, statische Seite** (Astro) nach dem Hack der bisherigen WordPress-Installation.

## Inhalt dieses Repos

| Pfad | Beschreibung | In Git? |
|---|---|---|
| `docs/superpowers/specs/` | Design-/Spezifikationsdokumente | ✅ |
| `news-export/` | Aus dem alten WordPress extrahierte News (Markdown, DE/EN) | ✅ |
| `wordpress-restore/` | Entpacktes Uploads-Backup (~194 MB, Quelle für Medien) | ❌ (ignoriert) |
| `*.sql.gz` | DB-Dump – **enthält sensible Daten** (Nutzer, Passwort-Hashes) | ❌ (ignoriert) |
| `*.zip` | Rohe Backup-Archive | ❌ (ignoriert) |

> ⚠️ Die Backup-Dateien (DB-Dump, Uploads-ZIP) sind bewusst **nicht** versioniert.
> Sie enthalten teils sensible Daten und sind zu groß für Git. Lokal aufbewahren / separat sichern.

## Status

Aktuelle Spezifikation: [docs/superpowers/specs/2026-07-02-teraport-website-neuaufbau-design.md](docs/superpowers/specs/2026-07-02-teraport-website-neuaufbau-design.md)

Nächster Schritt: Umsetzungsplan → Astro-Projekt aufsetzen.
