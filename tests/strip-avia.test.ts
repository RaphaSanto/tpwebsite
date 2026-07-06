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

  it('entfernt selbstschließende Layout-Shortcodes (av_hr)', () => {
    const input = "Text A\n[av_hr class='default']\nText B";
    const out = stripAvia(input);
    expect(out).toContain('Text A');
    expect(out).toContain('Text B');
    expect(out).not.toContain('av_hr');
  });

  it('behält den Folientext von av_slide (paariges Shortcode) und lässt keine av_-Reste', () => {
    const input = "[av_slideshow][av_slide id='1']Folientext[/av_slide][/av_slideshow]";
    const out = stripAvia(input);
    expect(out).toContain('Folientext');
    expect(out).not.toContain('av_');
  });

  it('lässt normalen Text unangetastet', () => {
    expect(stripAvia('Nur Text.')).toBe('Nur Text.');
  });

  it('toleriert escapte Anführungszeichen in Attributwerten (av_heading)', () => {
    const input = "[av_heading heading='Kund\\'s Erfolg' tag='h2'][/av_heading]";
    expect(stripAvia(input).trim()).toBe("## Kund's Erfolg");
  });

  it('behält den sichtbaren Text eines av_button (label) als eigene Zeile', () => {
    const input = "Vorher\n[av_button label='Demo anfragen' link='manually,http://example.com' color='theme-color']\nNachher";
    const out = stripAvia(input);
    expect(out).toContain('Demo anfragen');
    expect(out).not.toContain('av_button');
  });

  it('behält die Caption eines av_image als eigene Zeile', () => {
    const input = "[av_image src='foo.jpg' caption='Prozessbild' attachment='1'][/av_image]";
    const out = stripAvia(input);
    expect(out).toContain('Prozessbild');
    expect(out).not.toContain('av_image');
  });

  it('entfernt av_image ohne Caption ohne Textreste', () => {
    const input = "Vorher\n[av_image src='foo.jpg' attachment='1'][/av_image]\nNachher";
    const out = stripAvia(input);
    expect(out).toContain('Vorher');
    expect(out).toContain('Nachher');
    expect(out).not.toContain('av_image');
  });
});
