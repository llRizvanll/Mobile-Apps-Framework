# src/features — rules for product features

Create features with `npm run gen:feature -- <name> [--flag [--on]]`. Copy patterns from `todos/` (MVVM) and `assistant/` (MVI + AI).

Layout per feature: `domain/` (pure TS: entities, rules, ports, use cases) → `data/` (zod DTOs, mappers, repositories)
→ `presentation/` (ViewModel/MviStore + screens) · `ai/tools.ts` · `tokens.ts` · `translations.ts` · `module.ts` · `__tests__/`.

- `module.ts` is the only thing the app imports (via `src/app/modules.ts`). Declare `featureFlag`, `tabs`, `translations`, `tools`, `reducers` + `persist` there.
- Don't import `@app/*`, `@brands/*` or other features' internals (lint enforces). Read brand data with `useBrandConfig()`.
- Use `@framework/ui` components, theme tokens and `useTranslation<typeof en>()`; provide every locale the brands support.
- Runtime switches: `useFlag('<ns>.<thing>')` (register the flag first with `npm run flags -- add`).
- Add matching `route(...)` entries to `mockRoutes` in `src/app/bootstrap/mockBackend.ts` for new endpoints.
- `todos` and `assistant` are examples (removable with `npm run examples:remove`); `settings` and `devtools` are permanent. App-level tests must not depend on example features.
- Tests: domain/VM unit tests with fakes, data tests with a stub transport, one `renderWithFramework` integration test.
