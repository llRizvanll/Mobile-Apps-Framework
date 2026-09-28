---
name: integrations
description: Connect this React Native app to a backend (REST + zod, auth/token refresh, GraphQL, WebSocket, AI proxy) or integrate a vendor SDK (Sentry, Segment, Amplitude, Firebase, MMKV, remote config, SQLite) through the framework's ports. Use when the user wants real APIs, login, or to add/swap a service.
---

# Integrations

Reference: `docs/integrations.md`. Rule: vendor/native SDKs are wired **only** in `src/app/bootstrap/adapters.ts`; features never import them.

## Backend

1. Set `api.rest.baseUrl` (+ `graphql`, `websocket`) per environment in `src/brands/<id>/index.ts`; run with `EXPO_PUBLIC_API_MODE=live`.
2. In the feature's `data/`: zod schema as `parser`, map DTO → domain; never leak DTOs past `data/`.
3. Auth: an `auth` module binding `AccessTokenProviderToken` (read `SecureStoreToken`) and `AuthRefreshPortToken` (`refresh()` → boolean, `onRefreshFailed` → `sessionSlice.actions.signedOut()`). Login calls use `meta: { skipAuth: true }`; dispatch `signedIn({ userId })`. Dependent modules: `dependsOn: ['auth']`.
4. GraphQL: codegen `client-preset` with `documentMode: 'string'` → `GraphQLClientToken` / `GraphQLSubscriptionClientToken`. WebSocket: `WebSocketClientToken`.
5. AI: backend implements `POST {baseUrl}{ai.path}` (`ChatRequest` → `ChatResponse`, types in `src/framework/ai/types.ts`); keys stay server-side.
6. Keep `src/app/bootstrap/mockBackend.ts` routes in sync so mock mode and tests work.

## Vendor SDK

1. Find the port: `CrashReporter` (`crashReporter`), `AnalyticsProvider[]` (`analyticsProviders`), `LogSink[]`, `SpanExporter[]`, `KeyValueStore` (`createMMKVStore`), `SecureStore`, `Database` (`createExpoSQLiteDatabase`), `RemoteConfigProvider` (`remoteConfig`), `HttpTransport`.
2. `npx expo install <pkg>`; add its config plugin to `app.config.ts` `plugins` if it has one.
3. Implement the port as a small object mapping to the SDK (larger ones in `src/app/bootstrap/adapters/<vendor>.ts`); pass it in `createPlatformAdapters()`.
4. No port fits → `extend-framework` skill (new framework module), not an SDK import in a feature.

## Verify

Unit-test adapters with a fake SDK object; data tests with a stub transport; `npm run verify && npm run bundle:check`; native SDKs need `npm run ios|android`.
