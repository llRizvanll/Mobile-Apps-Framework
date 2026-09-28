# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, Copilot…) working in this repo.
Humans: this is also the fastest orientation. Deeper docs: `docs/architecture.md`, `docs/features.md`, `docs/brands.md`, `docs/adr/`.

## What this is

A white-label React Native framework (`@org/*`, TypeScript strict) + brands (`brands/*`) + a reference
Expo app (`apps/example`). Hexagonal framework, clean-architecture features, MVVM/MVI, typed DI.

## Commands

| Task                                           | Command                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Full gate (run before finishing any task)      | `npm run verify` (typecheck + lint + tests)                                                |
| Typecheck                                      | `npm run typecheck`                                                                        |
| Lint (includes architecture boundaries)        | `npm run lint`                                                                             |
| Tests                                          | `npm test` · single file: `npx jest path/to/file`                                          |
| New feature (always use this, don't hand-copy) | `npm run gen:feature -- <kebab-name> [--flag]`                                             |
| New brand                                      | `npm run gen:brand -- <id> --name "…" --bundle com.x.y [--color "#hex"] [--locales en,fr]` |
| Bundle check (Metro)                           | `cd apps/example && CI=1 npx expo export --platform ios`                                   |
| Run app                                        | `cd apps/example && EXPO_PUBLIC_BRAND=acme npx expo run:ios`                               |

## Where things go

| You need to…                                | Put it in                                                  |
| ------------------------------------------- | ---------------------------------------------------------- |
| Add product functionality                   | `apps/<app>/src/features/<name>/` via `gen:feature`        |
| Call a native module / vendor SDK           | an adapter wired in `apps/<app>/src/bootstrap/adapters.ts` |
| Add a reusable, product-agnostic capability | a framework package (`packages/*`) behind a port           |
| Brand-specific look, copy, config           | `brands/<id>/src/index.ts(x)`                              |
| Brand store identity                        | `brands/<id>/src/native.json`                              |

## Invariants (lint/tests enforce most of these — don't disable rules to get green)

1. **Layering**: packages import only their declared `@org/*` deps (see `docs/architecture.md`). Never deep-import `@org/x/src/...`.
2. **Clean architecture**: `domain/` has no React, RN, Redux, HTTP or storage imports; `data/` never imports `presentation/`.
3. **Errors**: data-layer functions return `Result<T, AppError>`; don't throw across boundaries. Surface UI errors as i18n keys (`userMessageKey`).
4. **No hard-coded UI values**: colours/spacing/typography from theme tokens; copy from translations; components from `@org/ui`.
5. **Secrets** only via `SecureStoreToken` — never Redux, never `KeyValueStore`, never logs.
6. **DI**: resolve from the container only at composition edges (`module.ts`, screens via `useResolver`/`useInject`). Classes take dependencies through constructors.
7. **State**: screen state in a `ViewModel`/`MviStore`; Redux only for shell/global/persisted state.
8. **AI tools** call use cases (never repositories/HTTP directly). Side-effecting tools set `requiresConfirmation: true`. Never log prompt/response content.
9. **Types**: no `any`, no non-null `!` outside tests, no `@ts-ignore`. `exactOptionalPropertyTypes` is on — spread optional props conditionally.
10. **Tests** accompany changes: unit (domain/VM with fakes), data (stub transport), integration (`renderWithFramework` + `mockHttp`).

## Conventions

- DI tokens: `createToken<T>('<feature>.<Name>')`, exported from the feature's `tokens.ts`.
- Class bindings: `c.bind(T).toClass(Impl, [DepA, DepB] as const)`.
- Tool names: `<feature>.<verb>` (e.g. `todos.add`).
- Translations: namespace = camelCase feature name; non-base locales typed with `Shape<typeof en>`.
- Test ids: `<feature>.<element>[.<id>]`.
- RNTL v14 APIs are async: `await render(...)`, `await fireEvent.press(...)`.

## Definition of done

`npm run verify` passes, new behaviour has tests, no new lint disables without a `-- reason`, docs
updated if you changed a public API or a convention.
