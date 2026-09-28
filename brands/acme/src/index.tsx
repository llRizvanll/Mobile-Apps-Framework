import { defineBrand } from '@org/core';
import { DefaultButton, type ButtonProps } from '@org/ui';
import native from './native.json';

/** Acme: bold coral palette, pill buttons, English + Arabic (RTL), AI assistant enabled. */
function AcmeButton(props: ButtonProps) {
  // Decorates the framework default rather than replacing it — keeps a11y/loading behaviour.
  return <DefaultButton {...props} size={props.size ?? 'lg'} />;
}

export default defineBrand({
  config: {
    // Native identity is shared with app.config.ts (store builds) via native.json.
    id: native.id,
    displayName: native.displayName,
    app: native.app,
    api: {
      rest: { baseUrl: 'https://api.dev.acme.example/v1' },
      graphql: {
        url: 'https://api.dev.acme.example/graphql',
        wsUrl: 'wss://api.dev.acme.example/graphql',
      },
    },
    i18n: { defaultLocale: 'en', supportedLocales: ['en', 'ar'] },
    features: { todos: true, assistant: true },
    ai: { enabled: true, path: '/ai/chat', defaultModel: 'balanced' },
  },
  environments: {
    staging: { api: { rest: { baseUrl: 'https://api.staging.acme.example/v1' } } },
    production: {
      api: {
        rest: { baseUrl: 'https://api.acme.example/v1' },
        graphql: {
          url: 'https://api.acme.example/graphql',
          wsUrl: 'wss://api.acme.example/graphql',
        },
      },
      observability: { logLevel: 'warn', requireConsent: true },
    },
  },
  theme: {
    name: 'acme',
    colors: {
      light: {
        primary: '#C2185B',
        primaryContainer: '#FFD9E2',
        onPrimaryContainer: '#3E001D',
        focus: '#C2185B',
      },
      dark: {
        primary: '#FFB1C8',
        onPrimary: '#5E1133',
        primaryContainer: '#8E0E45',
        onPrimaryContainer: '#FFD9E2',
        focus: '#FFB1C8',
      },
    },
    components: { button: { radius: 'pill' }, card: { radius: 'xl' } },
  },
  translations: {
    en: { brand: { tagline: 'Get things done, the Acme way.' } },
    ar: { brand: { tagline: 'أنجز مهامك على طريقة أكمي.' } },
  },
  components: { Button: AcmeButton },
});
