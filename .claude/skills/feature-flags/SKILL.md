---
name: feature-flags
description: Add, toggle, roll out, inspect or remove feature flags in this React Native app (registry, brand values, environment overlays, env-var and device overrides, remote config). Use when the user wants to turn a feature on/off, gate code, run an experiment or clean up flags.
---

# Feature flags

Reference: `docs/feature-flags.md`. Registry: `src/config/feature-flags.json`. Brand values: `src/brands/<id>/features.json`.

## Decide the kind

- Gates a whole feature (module, tab, DI, tools)? → `kind: module` (applies at boot; restart needed).
- Changes behaviour inside screens, limits, variants, kill switch? → `kind: runtime` (live via `useFlag`).

## Common tasks

| Task                   | Command                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| Inspect                | `npm run flags`                                                          |
| Add                    | `npm run flags -- add <key> --kind module                                | runtime --description "…" --owner <team> [--default on] [--requires a,b] [--expires YYYY-MM-DD]` |
| Default on/off         | `npm run flags -- on                                                     | off <key>`                                                                                       |
| Per brand              | `npm run flags -- on                                                     | off <key> --brand <id                                                                            | all>` |
| Non-boolean            | `npm run flags -- set <key> <value> [--brand <id>]`                      |
| Back to default        | `npm run flags -- unset <key> --brand <id>`                              |
| Production-only change | edit `environments.production.features` in `src/brands/<id>/index.ts(x)` |
| One run, no files      | `EXPO_PUBLIC_FEATURES="<key>=off,<key2>=on" npm start`                   |
| Remove                 | `npm run flags -- remove <key>` then delete the code paths it reports    |

## Using flags in code

- Module: `featureFlag: flag('<key>')` in `module.ts` (import `flag` from `@config/featureFlags`).
- Runtime: `const on = useFlag('<key>')` / `useFlagValue('<key>', fallback)`; tab visibility: `visibleWhen: '<key>'`.
- Outside React: `resolver.get(FeatureFlagsToken).isEnabled('<key>')`.
- Keys are compile-time checked. A typo is a type error, so never cast.

## Rules

- Always set `owner` and, for temporary flags, `expires`.
- Don't use flags for per-brand _configuration_ (URLs, copy). That belongs in brand config.
- Keep `devtools: false` in every brand's production overlay (the contract test enforces it).

## Verify

`npm run flags -- doctor && npm run verify`. Test flag behaviour with `renderWithFramework(..., { flags: { definitions: featureFlags, overrides: {...} } })` or `flags.setOverride` inside `act`.
