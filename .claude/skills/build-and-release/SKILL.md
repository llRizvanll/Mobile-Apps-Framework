---
name: build-and-release
description: Build and ship this React Native app — local iOS/Android builds, per-brand EAS builds (development/preview/production), store submission, versioning, OTA updates and pre-release checks. Use when the user asks to build, release, submit or publish the app.
---

# Build and release

Reference: `docs/configuration.md#build--release`.

## Pre-flight (always)

```bash
npm run verify && npm run flags -- doctor && npm run bundle:check
```

## Local

- `EXPO_PUBLIC_BRAND=<id> EXPO_PUBLIC_ENV=<env> npm run ios|android`. Changing the brand requires a native rebuild.
- Native project issues: `npx expo prebuild --clean`.

## EAS (per brand × environment)

- Profiles: `development`, `preview`, `production` (brand `main`); extra brands get `<profile>-<brand>` profiles from the brand generator.
- `eas build --profile production --platform all` → `eas submit --profile production --platform ios|android` (append `-<brand>` for other brands).

## Versioning

- Bump `app.version` in `src/brands/<brand>/native.json`; the build number auto-increments. Update `CHANGELOG.md`.

## Risky features

- Ship behind a flag (off in `environments.production.features`), then roll out by brand or remote config. Never rely on device overrides in production (they're disabled).

## OTA

- Requires `npx expo install expo-updates` + `eas update:configure`; then `eas update --channel production`. JS-only changes; native/config changes need a store build.

Never run `eas submit`, publish updates, or push tags without the user's explicit confirmation.
