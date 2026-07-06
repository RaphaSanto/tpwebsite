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
  const body = stripAvia(post.content.replace(/\r\n?/g, '\n'));
  const fm = `---\ntitle: ${JSON.stringify(post.title)}\nlang: ${meta.lang}\nslug: ${JSON.stringify(meta.slug)}\n---\n\n`;
  await writeFile(join(DEST, meta.lang, `${meta.slug}.md`), fm + body + '\n', 'utf8');
  n++;
}
console.log(`[pages] geschrieben: ${n}/${Object.keys(TARGETS).length}`);
if (missing.length) { console.warn('[pages] fehlende IDs:', missing.join(', ')); process.exitCode = 1; }
