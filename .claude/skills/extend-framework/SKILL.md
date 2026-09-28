---
name: extend-framework
description: Extend the built-in framework in src/framework — add a reusable module, a new port/adapter, middleware, UI slot or core capability while respecting layers.json. Use when a capability is product-agnostic and should be shared by several features.
---

# Extend the framework

Read `src/framework/AGENTS.md` first. The framework must stay product-agnostic: it never imports `@app`, `@features`, `@brands` or `@config`.

## Prefer extension points before new code

Most needs are covered without touching the framework: module `register`/`tabs`/`tools`/`reducers`/`persist`, `HttpMiddlewareToken`, `LogSinkToken`, UI slots, `AnalyticsEventMap`, `RootStateRegistry` (`docs/features.md#extension-points`).

## New framework module

1. `src/framework/<module>/index.ts` (public API only) + `README.md` (purpose, API, ports, extension points) + `__tests__/`.
2. Add it to `src/framework/layers.json` with the **minimal** `dependsOn`. Lint enforces it.
3. Design: a port (interface) + default/no-op adapter + DI token(s) in `tokens.ts`; `Result`/`AppError` at I/O boundaries; no vendor SDK imports (structural types like `MMKVLike` instead).
4. Wire it in `src/framework/core/services.ts` only if every app needs it; otherwise let modules bind it.
5. Update `docs/architecture.md` (layers + module table) and `docs/decisions.md` if it sets a convention.
6. `npm run verify`.

## Changing an existing module

- Keep public APIs backward compatible where possible. Features and brands depend on them. Note breaking changes in `CHANGELOG.md`.
- Never add a `layers.json` edge just to make lint pass; move the code instead.
