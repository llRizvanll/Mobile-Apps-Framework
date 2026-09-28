---
title: White-label release workflow
description: Ship one React Native codebase as many branded iOS and Android apps — generate a brand, validate config and WCAG contrast, build per-brand bundle IDs with Expo, and release to the App Store and Google Play.
---

# White-label release

## From brand request to store

```mermaid
flowchart TD
  R([New client / brand]) --> G["npm run gen:brand -- initech<br/>--name 'Initech Ops' --bundle com.initech.ops"]
  G --> E["Edit brands/initech/src/index.ts<br/>APIs per env · theme · copy · flags · component overrides"]
  E --> CT{"npm test<br/>brand contract"}
  CT -- "invalid config (any env)" --> E
  CT -- "WCAG AA contrast failure" --> E
  CT -- pass --> ID["npx expo config (EXPO_PUBLIC_BRAND=initech)<br/>name · bundle id · scheme · version"]
  ID --> B["Native build per brand<br/>expo run / EAS build"]
  B --> Q[QA on staging environment]
  Q --> S([App Store / Google Play])
```

## One source of truth for identity

```mermaid
flowchart LR
  N["brands/&lt;id&gt;/src/native.json"] --> AC["apps/example/app.config.ts<br/>(Node, at build time)"]
  N --> BC["brands/&lt;id&gt;/src/index.ts<br/>(runtime BrandConfig)"]
  AC --> NB["iOS bundleIdentifier · Android package · scheme · version"]
  BC --> RT["config.app.* used for headers, analytics super-props"]
```

Because both sides read the same file, bundle IDs and versions can't drift between the native build and the JS runtime.

## Environments

```mermaid
flowchart LR
  BASE[config] --> DEV[development]
  BASE --> STG["staging overlay"]
  BASE --> PROD["production overlay<br/>logLevel warn · requireConsent"]
```

Build commands:

```bash
cd apps/example
EXPO_PUBLIC_BRAND=globex EXPO_PUBLIC_ENV=staging EXPO_PUBLIC_API_MODE=live npx expo run:ios
```

## Brand repos (scaling out)

When a brand needs its own team or release cadence, move it to its own repository. The repo depends on published `@org/*` packages and contains the `brand/` package, its features, and a composition root copied from `apps/example/src/bootstrap/`. Upgrading the framework is then a version bump. See [Brands](../brands.md).
