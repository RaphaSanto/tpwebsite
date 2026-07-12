export type Lang = 'de' | 'en';

const strings = {
  de: {
    'nav.products': 'Produkte',
    'nav.services': 'Services',
    'nav.company': 'Unternehmen',
    'nav.news': 'News',
    'nav.contact': 'Kontakt',
    'footer.legal': 'Impressum',
    'footer.privacy': 'Datenschutz',
    'footer.tagline': '.simple.precise.fast',
    'home.hero.kicker': 'Design-Validierung und Werkzeugkostenkalkulation',
    'home.hero.title': 'simple · precise · fast',
    'home.hero.cta': 'Kontakt aufnehmen',
    'home.products.title': 'Unsere Produkte',
    'home.news.title': 'Aktuelles',
    'home.news.all': 'Alle News',
    'benefits.1': 'einfache Bedienung',
    'benefits.2': 'schnelle Berechnung',
    'benefits.3': 'wertvolle Erkentnisse',
    'news.title': 'News',
    'news.back': 'Zurück zur Übersicht',
    'contact.title': 'Kontakt',
    'contact.intro': 'Sie möchten mehr über mido oder veo erfahren? Schreiben Sie uns – wir melden uns kurzfristig.',
    'contact.mail.cta': 'E-Mail schreiben',
    'product.more': 'Mehr erfahren',
  },
  en: {
    'nav.products': 'Products',
    'nav.services': 'Services',
    'nav.company': 'Company',
    'nav.news': 'News',
    'nav.contact': 'Contact',
    'footer.legal': 'Legal Notice',
    'footer.privacy': 'Privacy policy',
    'footer.tagline': '.simple.precise.fast',
    'home.hero.kicker': 'Design validation & tool-cost-calculation',
    'home.hero.title': 'simple · precise · fast',
    'home.hero.cta': 'Get in touch',
    'home.products.title': 'Our products',
    'home.news.title': 'Latest news',
    'home.news.all': 'All news',
    'benefits.1': 'easy to use',
    'benefits.2': 'valuable insights',
    'benefits.3': 'immediate results',
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
