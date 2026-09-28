# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, Copilot…) working in this repo. Humans: this is
also the fastest orientation. Local rules: `src/framework/AGENTS.md`, `src/features/AGENTS.md`, `src/brands/AGENTS.md`.
Docs: `docs/README.md`.

## What this is

A **React Native + Expo app in strict TypeScript** (the repo root is the app) with a **built-in framework** in
`src/framework/`. Features live in `src/features/`, brands (white-label) in `src/brands/`, the feature-flag registry
in `src/config/`, and the shell + composition root in `src/app/`.

## Commands

| Task                                              | Command                                                                                                         |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Full gate (run before finishing any task)         | `npm run verify` (typecheck + lint + tests)                                                                     |
| Feature-flag validation                           | `npm run flags -- doctor`                                                                                       |
| Bundle check (Metro, catches alias/import errors) | `npm run bundle:check`                                                                                          |
| Single test file                                  | `npx jest path/to/file`                                                                                         |
| New feature (always use this; don't hand-copy)    | `npm run gen:feature -- <kebab-name> [--flag [--on]]`                                                           |
| New brand                                         | `npm run gen:brand -- <id> --name "…" --bundle com.x.y [--color "#hex"] [--locales en,fr]`                      |
| Flags                                             | `npm run flags` · `-- on/off <flag> [--brand <id\|all>]` · `-- add <flag> --description …` · `-- remove <flag>` |
| Strip example features (clean start)              | `npm run examples:remove -- --yes`                                                                              |
| Run app                                           | `npm run ios` / `npm run android` (env: `EXPO_PUBLIC_BRAND`, `_ENV`, `_API_MODE`, `_FEATURES`)                  |

## Where things go

| You need to…                                        | Put it in                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| Add product functionality                           | `src/features/<name>/` via `gen:feature`                               |
| Turn something on/off, gate code, run an experiment | a flag in `src/config/feature-flags.json` (`npm run flags -- add`)     |
| Call a native module / vendor SDK                   | an adapter in `src/app/bootstrap/adapters.ts`                          |
| Add a reusable, product-agnostic capability         | a framework module in `src/framework/` behind a port (+ `layers.json`) |
| Brand look, copy, config, feature set               | `src/brands/<id>/index.ts(x)`, `features.json`                         |
| Store identity (name, bundle id, version)           | `src/brands/<id>/native.json`                                          |
| Build profiles                                      | `eas.json`                                                             |
| Change navigation                                   | `src/app/AppShell.tsx` (tabs come from `module.tabs`)                  |

## Skills (`.claude/skills/`)

`new-feature` · `feature-flags` · `new-brand` · `integrations` · `extend-framework` ·
`write-tests` · `build-and-release` · `adopt-template` · `architecture-review`. Use the matching skill for the task.

## Invariants (lint/tests enforce most; don't disable rules to get green)

1. **Layering**: framework modules import only what `src/framework/layers.json` allows, and never `@app`, `@features`, `@brands`, `@config`. Import framework modules via `@framework/<module>` (no deep imports except `@framework/di/react`).
2. **Features**: never import `@app/*`, `@brands/*` or another feature's `domain`/`data`/`presentation`.
3. **Clean architecture**: `domain/` has no React, RN, Redux, HTTP or storage imports; `data/` never imports `presentation/`.
4. **Errors**: data-layer functions return `Result<T, AppError>`; don't throw across boundaries; UI errors are i18n keys (`userMessageKey`).
5. **Feature flags**: every flag is registered (with `owner`, and `expires` if temporary); modules use `featureFlag: flag('…')`; UI uses `useFlag('…')`. Never cast flag keys. Production brands keep `devtools: false`.
6. **No hard-coded UI values**: colours/spacing/typography from theme tokens; copy from translations (all brand locales); components from `@framework/ui`.
7. **Secrets** only via `SecureStoreToken`: never Redux, `KeyValueStore`, logs, or `EXPO_PUBLIC_*` env vars.
8. **DI**: resolve from the container only at composition edges (`module.ts`, screens via `useResolver`/`useInject`). Classes take dependencies through constructors.
9. **State**: screen state in a `ViewModel`/`MviStore`; Redux only for shared/persisted state (`reducers` + explicit `persist`).
10. **AI tools** call use cases (never repositories/HTTP directly). Side-effecting tools set `requiresConfirmation: true`. Never log prompt/response content.
11. **Types**: no `any`, no non-null `!` outside tests, no `@ts-ignore`. `exactOptionalPropertyTypes` is on, so spread optional props conditionally.
12. **Tests** accompany changes at the right level; assert behaviour, not exact module/tab lists.

## Conventions

- DI tokens: `createToken<T>('<feature>.<Name>')` in the feature's `tokens.ts`; bindings `c.bind(T).toClass(Impl, [DepA] as const)`.
- Flag keys: lowerCamel, dotted for sub-features (`todos.showCompleted`). Tool names: `<feature>.<verb>`.
- Translations: namespace = camelCase feature name; include `<ns>.tab`; non-base locales typed `Shape<typeof en>`.
- Test ids: `<feature>.<element>[.<id>]`; tabs `tab.<key>`.
- RNTL v14 APIs are async: `await render(...)`, `await fireEvent.press(...)`.
- Native modules: install with `npx expo install`, wire only in `adapters.ts`, and rebuild natively.

## Definition of done

`npm run verify` and `npm run flags -- doctor` pass; new behaviour has tests; the mock backend supports new
endpoints; no new lint disables without `-- reason`; docs updated if a public API, convention or workflow changed
(framework README, the matching guide in `docs/`, `docs/decisions.md` for lasting decisions, `CHANGELOG.md`).
