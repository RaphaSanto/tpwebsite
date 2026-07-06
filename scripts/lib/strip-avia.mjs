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
