export type Lang = 'de' | 'en';

const strings = {
  de: {
    'nav.company': 'Unternehmen',
    'nav.news': 'News',
    'nav.contact': 'Kontakt',
    'footer.legal': 'Impressum',
    'footer.privacy': 'AGB / Datenschutz',
    'footer.tagline': '.software.services.excellence',
    'home.hero.kicker': 'CAD-basierte Kalkulation & 3D-Visualisierung',
    'home.hero.title': 'Präzision von der ersten CAD-Datei an.',
    'home.hero.cta': 'Kontakt aufnehmen',
    'home.products.title': 'Unsere Produkte',
    'home.news.title': 'Aktuelles',
    'home.news.all': 'Alle News',
    'benefits.1': 'CAD-basiert',
    'benefits.2': 'Regelbasiert & nachvollziehbar',
    'benefits.3': 'Praxisbewährt',
    'news.title': 'News',
    'news.back': 'Zurück zur Übersicht',
    'contact.title': 'Kontakt',
    'contact.intro': 'Sie möchten mehr über mido oder veo erfahren? Schreiben Sie uns – wir melden uns kurzfristig.',
    'contact.mail.cta': 'E-Mail schreiben',
    'product.more': 'Mehr erfahren',
  },
  en: {
    'nav.company': 'Company',
    'nav.news': 'News',
    'nav.contact': 'Contact',
    'footer.legal': 'Legal Notice',
    'footer.privacy': 'Terms / Data privacy',
    'footer.tagline': '.software.services.excellence',
    'home.hero.kicker': 'CAD-based costing & 3D visualization',
    'home.hero.title': 'Precision from the first CAD file.',
    'home.hero.cta': 'Get in touch',
    'home.products.title': 'Our products',
    'home.news.title': 'Latest news',
    'home.news.all': 'All news',
    'benefits.1': 'CAD-based',
    'benefits.2': 'Rule-based & traceable',
    'benefits.3': 'Proven in practice',
    'news.title': 'News',
    'news.back': 'Back to overview',
    'contact.title': 'Contact',
    'contact.intro': 'Want to learn more about mido or veo? Write to us – we will get back to you shortly.',
    'contact.mail.cta': 'Send an e-mail',
    'product.more': 'Learn more',
  },
} as const;

export type UiKey = keyof (typeof strings)['de'];

export function t(lang: Lang, key: UiKey): string {
  return strings[lang][key];
}
