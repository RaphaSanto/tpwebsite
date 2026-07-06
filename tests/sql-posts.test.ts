import { describe, it, expect } from 'vitest';
import { parseWpPosts } from '../scripts/lib/sql-posts.mjs';

const sql = "INSERT INTO `wp_posts` VALUES " +
  "(734,1,'2015-01-01 00:00:00','0000-00-00 00:00:00','Inhalt A','Homepage','','publish','closed','closed','','homepage','','','2015-01-01 00:00:00','0000-00-00 00:00:00','',0,'http://x/?p=734',0,'page','',0)," +
  "(3255,1,'2015-01-01 00:00:00','0000-00-00 00:00:00','It\\'s veo','veo','','publish','closed','closed','','veo','','','2015-01-01 00:00:00','0000-00-00 00:00:00','',0,'http://x/?p=3255',0,'page','',0);";

describe('parseWpPosts', () => {
  it('parst ID, Titel, Status, Slug, Typ', () => {
    const rows = parseWpPosts(sql);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 734, title: 'Homepage', status: 'publish', name: 'homepage', type: 'page' });
  });

  it('behandelt escaped Quotes im Inhalt korrekt', () => {
    const rows = parseWpPosts(sql);
    expect(rows[1].content).toBe("It's veo");
    expect(rows[1].title).toBe('veo');
  });

  it('dekodiert escaped Newline (\\n) im Inhalt zu echtem Zeilenumbruch statt Buchstabe n', () => {
    const sqlWithNewline = "INSERT INTO `wp_posts` VALUES " +
      "(1,1,'2015-01-01 00:00:00','0000-00-00 00:00:00','A\\nB','T','','publish','closed','closed','','slug','','','2015-01-01 00:00:00','0000-00-00 00:00:00','',0,'http://x/?p=1',0,'page','',0);";
    const rows = parseWpPosts(sqlWithNewline);
    expect(rows[0].content).toBe('A\nB');
    expect(rows[0].content).toContain('\n');
    expect(rows[0].content).not.toMatch(/AnB/);
  });

  it('behandelt doppelten Backslash vor Quote korrekt (literaler Backslash, Feld-/Zeilengrenzen bleiben intakt)', () => {
    const sqlWithDoubleBackslash = "INSERT INTO `wp_posts` VALUES " +
      "(1,1,'2015-01-01 00:00:00','0000-00-00 00:00:00','Pfad C:\\\\\\\\','T','','publish','closed','closed','','slug','','','2015-01-01 00:00:00','0000-00-00 00:00:00','',0,'http://x/?p=1',0,'page','',0);";
    const rows = parseWpPosts(sqlWithDoubleBackslash);
    expect(rows).toHaveLength(1);
    expect(rows[0].content.endsWith('\\')).toBe(true);
    expect(rows[0].title).toBe('T');
  });

  it('parst Zeilen aus zwei getrennten INSERT-Statements', () => {
    const sqlTwoInserts = sql + " INSERT INTO `wp_posts` VALUES " +
      "(9001,1,'2015-01-01 00:00:00','0000-00-00 00:00:00','Zweiter Insert','Titel2','','publish','closed','closed','','titel2','','','2015-01-01 00:00:00','0000-00-00 00:00:00','',0,'http://x/?p=9001',0,'page','',0);";
    const rows = parseWpPosts(sqlTwoInserts);
    expect(rows).toHaveLength(3);
    expect(rows.map(r => r.id)).toEqual([734, 3255, 9001]);
  });
});
