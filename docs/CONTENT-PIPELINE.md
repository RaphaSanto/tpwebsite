# Inhalts-Pipeline

Erzeugt die dateibasierten Inhalte aus den lokalen Backups.

- `npm run import:news`   – news-export/ → src/content/news/ (URLs normalisiert)
- `npm run extract:assets`– benötigte Uploads → src/assets/uploads/ (siehe src/assets/manifest.json)
- `npm run extract:pages` – DB-Dump → src/content/pages/ (Enfold-Shortcodes bereinigt)
- `npm run migrate`       – alle drei nacheinander

Quellen (nur lesen, nicht in Git): news-export/, wordpress-restore/, DB2094128_2026-06-08.sql.gz.
Ziele (in Git): src/content/, src/assets/.
