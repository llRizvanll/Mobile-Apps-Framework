---
name: architecture-review
description: Review a change (diff, PR or plan) in this React Native app against its architecture invariants — layering, clean architecture, Result errors, DI, state placement, feature flags, i18n/theme, security and tests. Use when asked to review code or before finishing a large change.
---

# Architecture review

Run the gates first: `npm run verify && npm run flags -- doctor`. Then check what tooling can't:

| Area         | Check                                                                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Placement    | Code is in the right place per the "Where things go" table in `AGENTS.md`. Product code isn't in `src/framework`; reusable code isn't duplicated across features |
| Layers       | No new `layers.json` edges without justification; no lint disables without `-- reason`                                                                           |
| Domain       | Pure TS; returns `Result`; errors carry `userMessageKey`; no DTOs in domain                                                                                      |
| Data         | zod `parser` on every response; mapping in `data/`; decorators for caching                                                                                       |
| Presentation | `@framework/ui` components; theme tokens; translated copy (all brand locales); a11y roles/labels; `testID`s                                                      |
| State        | Screen state in VM/MVI; Redux only for shared/persisted (`persist` declared explicitly)                                                                          |
| Flags        | Registered with owner (+ expiry if temporary); module vs runtime kind correct; no flags used as config                                                           |
| DI           | Constructor injection; `toClass(Impl, [..] as const)`; no container lookups inside domain/data                                                                   |
| AI           | Tools call use cases; mutating tools `requiresConfirmation`; no prompt content logged                                                                            |
| Security     | Secrets only in `SecureStoreToken`; nothing secret in `EXPO_PUBLIC_*`; logs free of PII                                                                          |
| Tests        | Right level; behaviour-based; no brittle exact lists                                                                                                             |
| Docs         | Public API or convention changes reflected in README/docs/ADR/CHANGELOG                                                                                          |

Report findings as: file:line, the rule violated, and a concrete fix.
