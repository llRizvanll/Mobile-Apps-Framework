---
title: FAQ
description: Frequently asked questions about the React Native white-label framework — Expo vs bare, navigation, state management choices, multi-brand builds, AI vendors, publishing packages and adopting it in an existing app.
---

# FAQ

## Is this a boilerplate or a framework?

Both. The `@org/*` packages are a **framework**: versioned, behind ports, upgradable. `apps/example` is the **starter** you copy or generate from. Brand repos can depend on published packages instead of forking.

## Does it require Expo?

No. Framework packages depend only on `react` and `react-native`. The example app uses Expo (SDK 57) for convenience: Metro config, native modules for storage and localization, and `app.config.ts` for per-brand identity. A bare React Native app wires the same `PlatformAdapters`.

## Which navigation library?

Navigation isn't opinionated yet. Use **expo-router** or **React Navigation**, and keep screens inside features. The example uses a minimal tab shell.

## Why Redux _and_ view models?

They cover different kinds of state. Redux holds **global, persisted, cross-feature** state (session, settings). View models and MVI stores hold **screen state** and are disposed with the screen. See [State & persistence](./workflows/state-and-persistence.md) and [ADR 0005](./adr/0005-state-placement.md).

## How do I build different apps per brand?

```bash
EXPO_PUBLIC_BRAND=globex npx expo run:ios
```

Store identity comes from `brands/<id>/src/native.json`. See the [white-label release workflow](./workflows/white-label-release.md).

## Can a brand change components, not just colours?

Yes. `defineBrand({ components: { Button: BrandButton } })` replaces any `@org/ui` slot. Wrap the `Default*` component to keep accessibility and loading behaviour.

## Which AI vendor does it use?

None directly. Apps call the `AIClient` port, which talks to **your backend**; the backend chooses the vendor and model per tier. See [ADR 0006](./adr/0006-ai-vendor-neutral.md).

## Can I use GraphQL codegen types?

Yes. Configure `@graphql-codegen/client-preset` with `documentMode: 'string'`. The generated `TypedDocumentString` documents plug straight into `gql.query(doc, vars)` with inferred types.

## How do I add Sentry / Segment / MMKV?

Write (or reuse) an adapter for the port and pass it in `bootstrap/adapters.ts`: `crashReporter`, `analyticsProviders`, `keyValueStore`. Feature code doesn't change.

## Can I adopt it in an existing app incrementally?

Yes. Start with `foundation`, `di` and `network` (a Result-based client with auth refresh), then move features into modules one at a time. `FrameworkProvider` can wrap an existing tree.

## How are packages published?

Inside the monorepo, packages ship TypeScript source ([ADR 0004](./adr/0004-source-packages.md)). To publish, add a build step that emits ESM and `.d.ts`, then release it, for example with Changesets.

## Is it production ready?

The architecture, tests and CI gates are in place. Before shipping, add real adapters (secure storage is already wired; add crash reporting and analytics), an auth feature, navigation, and native release pipelines.
