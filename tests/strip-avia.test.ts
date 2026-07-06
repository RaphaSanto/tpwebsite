// tests/strip-avia.test.ts
import { describe, it, expect } from 'vitest';
import { stripAvia } from '../scripts/lib/strip-avia.mjs';

describe('stripAvia', () => {
  it('entfernt Layout-Container-Shortcodes, behält Textinhalt', () => {
    const input = "[av_one_full first]\n[av_textblock size='' ]\nHallo Welt\n[/av_textblock]\n[/av_one_full]";
    expect(stripAvia(input).trim()).toBe('Hallo Welt');
  });

  it('wandelt av_heading in eine Markdown-Überschrift', () => {
    const input = "[av_heading heading='Über uns' tag='h2'][/av_heading]";
    expect(stripAvia(input).trim()).toBe('## Über uns');
  });

  it('entfernt selbstschließende Layout-Shortcodes (av_hr, av_slide)', () => {
    const input = "Text A\n[av_hr class='default']\nText B";
    const out = stripAvia(input);
    expect(out).toContain('Text A');
    expect(out).toContain('Text B');
    expect(out).not.toContain('av_hr');
  });

  it('lässt normalen Text unangetastet', () => {
    expect(stripAvia('Nur Text.')).toBe('Nur Text.');
  });
});
