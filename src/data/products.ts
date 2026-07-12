import type { Lang } from '../i18n/ui.ts';

export interface ProductTileData {
  title: string;
  teaser: string;
  slug: string;
  order: number;
}

/** Produkt-Kacheln der Startseite (sortiert nach order). */
export const products: Record<Lang, ProductTileData[]> = {
  "de": [
    {
      "title": "MIDO",
      "teaser": "Werkzeugkostenkalkulation aus 3D-CAD-Modellen – schnell, transparent, nachvollziehbar.",
      "slug": "mido",
      "order": 1
    },
    {
      "title": "veo",
      "teaser": "Design-Validierung für Druckguss- und Spritzgussbauteile – Fertigungsgerechtheit in Sekunden prüfen, direkt am 3D-CAD-Modell.",
      "slug": "veo",
      "order": 2
    },
    {
      "title": "toolkit",
      "teaser": "Modularer Software-Baukasten für 3D-Analysen – flexibel, neutral, hochgradig automatisierbar.",
      "slug": "toolkit",
      "order": 3
    },
    {
      "title": "connect",
      "teaser": "Wizard-gesteuerte Workflow-Oberfläche für automatisierte Berechnungen und Simulationen.",
      "slug": "connect",
      "order": 4
    }
  ],
  "en": [
    {
      "title": "mido",
      "teaser": "Tool cost calculation from 3D CAD models – fast, transparent, traceable.",
      "slug": "mido",
      "order": 1
    },
    {
      "title": "veo",
      "teaser": "Design validation for die casting and injection molding parts – check manufacturability in seconds, directly on the 3D CAD model.",
      "slug": "veo",
      "order": 2
    },
    {
      "title": "toolkit",
      "teaser": "Modular software toolkit for 3D analysis – flexible, neutral, highly automatable.",
      "slug": "toolkit",
      "order": 3
    },
    {
      "title": "connect",
      "teaser": "Wizard-driven workflow interface for automated calculations and simulations.",
      "slug": "connect",
      "order": 4
    }
  ]
};
