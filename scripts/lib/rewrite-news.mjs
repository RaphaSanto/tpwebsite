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
