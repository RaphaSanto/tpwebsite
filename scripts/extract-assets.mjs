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
