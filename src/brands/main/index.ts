import { defineBrand } from '@framework/core';
import features from './features.json';
import native from './native.json';

/**
 * The app's brand: runtime config, theme, copy and feature set. Single-brand apps just edit this;
 * white-label apps add more with `npm run gen:brand`. Docs: docs/brands.md, docs/configuration.md.
 */
export default defineBrand({
  config: {
    // Store identity (name, bundle id, version) is shared with app.config.ts via native.json.
    id: native.id,
    displayName: native.displayName,
    app: native.app,
    api: {
      rest: { baseUrl: 'https://api.dev.example.com/v1' },
      // graphql: { url: 'https://api.dev.example.com/graphql', wsUrl: 'wss://api.dev.example.com/graphql' },
      // websocket: { url: 'wss://api.dev.example.com/ws' },
    },
    i18n: { defaultLocale: 'en', supportedLocales: ['en', 'ar'] },
    // Flag values for this brand: features.json or `npm run flags -- on|off <flag> --brand main`.
    features,
    ai: { enabled: true, path: '/ai/chat', defaultModel: 'balanced' },
  },
  environments: {
    staging: { api: { rest: { baseUrl: 'https://api.staging.example.com/v1' } } },
    production: {
      api: { rest: { baseUrl: 'https://api.example.com/v1' } },
      observability: { logLevel: 'warn', requireConsent: true },
      features: { devtools: false },
    },
  },
  // Any subset of design tokens; the rest comes from the framework default theme.
  theme: { name: 'main', colors: { light: { primary: '#3D5AFE' }, dark: { primary: '#B9C3FF' } } },
  translations: {
    en: { brand: { tagline: 'Built on the React Native starter.' } },
    ar: { brand: { tagline: 'مبني على قالب React Native.' } },
  },
  // components: { Button: MyButton },  // override any @framework/ui slot (decorate Default* components)
});
