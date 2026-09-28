---
name: new-feature
description: Scaffold and implement a new clean-architecture feature module (domain/data/presentation/ai) in this React Native framework repo. Use when the user asks to add a feature, screen flow, or domain capability to an app.
---

# New feature

1. Pick a kebab-case name. Decide if it should ship behind a flag (unfinished → `--flag`).
2. Run `npm run gen:feature -- <name> [--entity EntityName] [--flag]`. Never hand-copy another feature.
3. Implement inside-out, keeping each layer's rules (see `docs/features.md`):
   - `domain/`: entity fields, validation returning `Result`, repository port, use cases.
   - `data/`: zod DTO schema matching the real API, mapper, repository adapter.
   - `presentation/`: ViewModel (CRUD) or MviStore (state machine / auditable flow); `@org/ui` only; copy via `useTranslation<typeof en>()`.
   - `ai/tools.ts`: tools call use cases; `requiresConfirmation: true` for anything that mutates.
   - `translations.ts`: add every locale the target brands support, typed `Shape<typeof en>`.
4. Tests: extend the generated unit test; add an integration test with `renderWithFramework(..., { modules: [xModule], mockHttp })` (see `apps/example/src/features/todos/__tests__/TodoListScreen.test.tsx`).
5. If flagged, enable in the relevant `brands/<id>/src/index.ts` `features`.
6. Run `npm run verify` and fix everything it reports.
