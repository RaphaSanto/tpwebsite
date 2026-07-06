import { describe, it, expect } from 'vitest';
import { altPath } from '../src/i18n/routes.ts';
import { t } from '../src/i18n/ui.ts';

describe('altPath', () => {
  it('mappt DE-Routen auf ihr EN-Gegenstück', () => {
    expect(altPath('/')).toBe('/en/');
    expect(altPath('/unternehmen/')).toBe('/en/company/');
    expect(altPath('/impressum/')).toBe('/en/legal-notice/');
  });
  it('mappt EN-Routen zurück auf DE', () => {
    expect(altPath('/en/')).toBe('/');
    expect(altPath('/en/company/')).toBe('/unternehmen/');
    expect(altPath('/en/data-privacy/')).toBe('/datenschutz/');
  });
  it('normalisiert fehlende Trailing-Slashes', () => {
    expect(altPath('/mido')).toBe('/en/mido/');
    expect(altPath('/en/mido')).toBe('/mido/');
  });
  it('fällt bei unbekannten Pfaden auf die Startseite der anderen Sprache zurück', () => {
    expect(altPath('/gibt-es-nicht/')).toBe('/en/');
    expect(altPath('/en/does-not-exist/')).toBe('/');
  });
});

describe('t', () => {
  it('liefert Strings je Sprache', () => {
    expect(t('de', 'nav.contact')).toBe('Kontakt');
    expect(t('en', 'nav.contact')).toBe('Contact');
  });
});
