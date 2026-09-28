# Configuration, build & release

## Where configuration lives

| Layer             | File                                                    | Read                         |
| ----------------- | ------------------------------------------------------- | ---------------------------- |
| Build environment | `.env` / shell / `eas.json` → `src/app/env.ts`          | build time (inlined by Expo) |
| Store identity    | `src/brands/<id>/native.json` → `app.config.ts`         | native build                 |
| Runtime config    | `src/brands/<id>/index.ts`                              | app start (zod-validated)    |
| Feature flags     | `src/config/feature-flags.json` + brand `features.json` | start / live                 |

## Environment variables

| Variable               | Values                                    | Default       |
| ---------------------- | ----------------------------------------- | ------------- |
| `EXPO_PUBLIC_BRAND`    | folder in `src/brands`                    | `main`        |
| `EXPO_PUBLIC_ENV`      | `development` · `staging` · `production`  | `development` |
| `EXPO_PUBLIC_API_MODE` | `mock` (in-app fake API) · `live`         | `mock`        |
| `EXPO_PUBLIC_FEATURES` | `a=on,b=off,c=20` (ignored in production) | —             |

> `EXPO_PUBLIC_*` values are bundled into the app. **Never put secrets there.**

## Runtime config (brand)

```ts
defineBrand({
  config: {
    id,
    displayName,
    app, // from native.json
    api: {
      rest: { baseUrl: 'https://api.dev.example.com/v1', timeoutMs: 30000 },
      graphql: { url: '…/graphql', wsUrl: 'wss://…/graphql' }, // optional
      websocket: { url: 'wss://…/ws' }, // optional
      headers: { 'X-Tenant': 'main' }, // public headers only
    },
    i18n: { defaultLocale: 'en', supportedLocales: ['en', 'ar'] },
    features, // features.json
    observability: { logLevel: 'info', analyticsEnabled: true, requireConsent: false },
    ai: { enabled: true, path: '/ai/chat', defaultModel: 'balanced' }, // + streamUrl for SSE
    extra: { supportEmail: 'help@example.com' }, // your own settings
  },
  environments: {
    staging: { api: { rest: { baseUrl: 'https://api.staging.example.com/v1' } } },
    production: {
      observability: { logLevel: 'warn', requireConsent: true },
      features: { devtools: false },
    },
  },
});
```

Invalid config stops the app with an **App configuration error** screen that lists every bad field. Read config
with `useBrandConfig()` or `resolver.get(BrandConfigToken)`.

## Build & release

```bash
npm run ios | android                     # dev build (expo run:*), generates ios/ android/ (git-ignored)
npx expo prebuild --clean                 # regenerate native projects after native dependency changes
npm run verify && npm run flags -- doctor && npm run bundle:check    # pre-flight
```

Changing `EXPO_PUBLIC_BRAND` changes the bundle id and name, so it needs a native rebuild. Env, flags and API mode need only a restart.

**EAS** (`eas.json`):

| Profile       | Environment | API  | Use                                   |
| ------------- | ----------- | ---- | ------------------------------------- |
| `development` | development | mock | dev client                            |
| `preview`     | staging     | live | QA / internal testing                 |
| `production`  | production  | live | stores (build number auto-increments) |

```bash
eas init
eas build --profile preview --platform all
eas build --profile production --platform all && eas submit --profile production --platform ios|android
```

`npm run gen:brand` adds `development-<id>`, `preview-<id>` and `production-<id>` profiles for extra brands (cloud builds don't see your shell env).

**Versioning:** bump `app.version` in `native.json`; EAS increments build numbers.

**OTA updates (optional):** `npx expo install expo-updates && eas update:configure`, then
`eas update --channel production`. These are JS-only; native or identity changes need a store build.

**Production guarantees (tested):** flag overrides are ignored, the devtools tab is off, console logging is off (logs go to sinks and breadcrumbs, PII-redacted), and analytics waits for consent if `requireConsent` is set.

## CI (`.github/workflows/ci.yml`)

- **verify**: format check · typecheck · lint (architecture) · `flags doctor` · tests
- **bundle**: production Metro export for iOS and Android

Dependabot opens weekly grouped update PRs.
