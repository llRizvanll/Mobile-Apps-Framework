import { defineBrand } from '@org/core';
import native from './native.json';

/** Globex: corporate teal, square corners, English + French, assistant disabled. */
export default defineBrand({
  config: {
    id: native.id,
    displayName: native.displayName,
    app: native.app,
    api: { rest: { baseUrl: 'https://dev.globex.example/api' }, headers: { 'X-Tenant': 'globex' } },
    i18n: { defaultLocale: 'en', supportedLocales: ['en', 'fr'] },
    features: { todos: true, assistant: false },
  },
  environments: {
    production: {
      api: { rest: { baseUrl: 'https://globex.example/api' } },
      observability: { logLevel: 'error' },
    },
  },
  theme: {
    name: 'globex',
    colors: {
      light: {
        primary: '#00695C',
        primaryContainer: '#A7F3E4',
        onPrimaryContainer: '#00201B',
        focus: '#00695C',
      },
      dark: {
        primary: '#6FD8C4',
        onPrimary: '#003730',
        primaryContainer: '#005045',
        onPrimaryContainer: '#A7F3E4',
        focus: '#6FD8C4',
      },
    },
    radii: { sm: 2, md: 2, lg: 4, xl: 6 },
    components: { button: { radius: 'sm' }, input: { radius: 'sm' } },
  },
  translations: {
    en: { brand: { tagline: 'Enterprise work, simplified.' } },
    fr: {
      brand: { tagline: 'Le travail en entreprise, simplifié.' },
      framework: {
        error: { title: 'Une erreur est survenue', generic: 'Veuillez réessayer.' },
        action: { retry: 'Réessayer' },
      },
    },
  },
});
