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
});
