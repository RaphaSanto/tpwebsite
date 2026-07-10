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
if (missing > 0) console.warn('[news-images] Hinweis: fehlende Dateien bitte nachliefern und Runner erneut ausführen.');
