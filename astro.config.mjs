import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.teraport.de',
  i18n: {
    locales: ['de', 'en'],
    defaultLocale: 'de',
    routing: {
      prefixDefaultLocale: true, // /de/… und /en/… symmetrisch; / leitet auf /de/ um
      redirectToDefaultLocale: true,
    },
  },
});
