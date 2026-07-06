// Reiner Tokenizer für die wp_posts-INSERTs eines mysqldump.
// Spaltenreihenfolge (Standard-WP): 0 ID,1 author,2 date,3 date_gmt,4 content,
// 5 title,6 excerpt,7 status,8 comment_status,9 ping_status,10 password,
// 11 name,12 to_ping,13 pinged,14 modified,15 modified_gmt,16 content_filtered,
// 17 parent,18 guid,19 menu_order,20 type,21 mime_type,22 comment_count

function splitRows(s) {
  const rows = [];
  let i = s.indexOf('INSERT INTO `wp_posts` VALUES');
  while (i !== -1) {
    i = s.indexOf('(', i);
    let depth = 0, inq = false, esc = false, row = '';
    for (; i < s.length; i++) {
      const c = s[i];
      if (inq) {
        row += c;
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === "'") inq = false;
      } else if (c === "'") { inq = true; row += c; }
      else if (c === '(') { if (depth > 0) row += c; depth++; }
      else if (c === ')') { depth--; if (depth === 0) { rows.push(row); row = ''; } else row += c; }
      else if (c === ';' && depth === 0) break;
      else if (depth > 0) row += c;
    }
    i = s.indexOf('INSERT INTO `wp_posts` VALUES', i);
  }
  return rows;
}

// mysqldump-Escape-Sequenzen -> echtes Zeichen. Alles Undefinierte bleibt
// wie bisher: Backslash entfernen, Zeichen unverändert übernehmen.
const ESCAPE_MAP = {
  n: '\n',
  r: '\r',
  t: '\t',
  '0': '\0',
  "'": "'",
  '"': '"',
  '\\': '\\',
};

function splitFields(row) {
  const out = [];
  let cur = '', inq = false, esc = false;
  for (const c of row) {
    if (inq) {
      if (esc) { cur += (c in ESCAPE_MAP ? ESCAPE_MAP[c] : c); esc = false; }
      else if (c === '\\') { esc = true; }        // Escape-Zeichen verwerfen
      else if (c === "'") inq = false;
      else cur += c;
    } else if (c === "'") inq = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

export function parseWpPosts(sql) {
  const rows = [];
  for (const raw of splitRows(sql)) {
    const f = splitFields(raw);
    if (f.length < 23) continue;
    rows.push({
      id: Number(f[0]),
      content: f[4],
      title: f[5],
      status: f[7],
      name: f[11],
      type: f[20],
    });
  }
  return rows;
}
