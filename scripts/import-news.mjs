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
