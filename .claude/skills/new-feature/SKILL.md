---
name: new-feature
description: Scaffold and implement a new clean-architecture feature module (domain/data/presentation/ai, tab, feature flag, tests) in this React Native app. Use when the user asks to add a feature, screen, flow or domain capability.
---

# New feature

1. Pick a kebab-case name. If it's unfinished or risky, gate it: `--flag` (default off) or `--flag --on`.
2. Run `npm run gen:feature -- <name> [--entity EntityName] [--flag [--on]]`. Never hand-copy another feature.
   This creates `src/features/<name>/`, registers the module in `src/app/modules.ts`, adds a tab, and (with `--flag`) a registry entry.
3. Implement inside-out, keeping each layer's rules (`src/features/AGENTS.md`, `docs/features.md`):
   - `domain/`: entity fields, validation returning `Result`, repository port, use cases. Pure TS.
   - `data/`: zod DTO schema matching the real API, mapper, repository adapter (`HttpClientToken`).
   - `presentation/`: `ViewModel` (CRUD) or `MviStore` (state machine); `@framework/ui` only; copy via `useTranslation<typeof en>()`.
   - `ai/tools.ts`: tools call use cases; `requiresConfirmation: true` for anything that mutates.
   - `translations.ts`: every locale the target brands support, typed `Shape<typeof en>`, including `<ns>.tab`.
   - `module.ts`: bindings (`toClass(Impl, [Dep] as const)`), `reducers`/`persist` only for cross-feature state, `tabs`.
4. Runtime behaviour switches: `npm run flags -- add <ns>.<thing> --description "…"` then `useFlag('<ns>.<thing>')`.
5. Tests: extend the generated unit test; add an integration test with
   `renderWithFramework(<Screen/>, { modules: [xModule], mockHttp })` (pattern: `src/features/todos/__tests__/TodoListScreen.test.tsx`).
6. Add mock endpoints to `mockRoutes` in `src/app/bootstrap/mockBackend.ts` (`route('GET', '/orders/:id', (req, { id }) => ({ data }))`) so the feature works with `EXPO_PUBLIC_API_MODE=mock`.
7. Run `npm run verify && npm run flags -- doctor` and fix everything reported.
