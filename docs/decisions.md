# Decisions

Short records of the choices that shape this codebase. Add a section when you make a decision with lasting impact.

**1. Ports & adapters.** Every native or vendor capability is an interface in the framework. Adapters accept structural
types (`MMKVLike`, `ExpoSecureStoreLike`), so the framework has no native dependencies and boots in Jest. Apps wire
vendors in one file (`adapters.ts`).

**2. Typed DI without decorators.** A small container keyed by `Token<T>`. `toClass(Impl, [A, B] as const)` is checked
against the constructor. No `reflect-metadata` or Babel decorator config, and no Hermes edge cases.

**3. `Result` at data boundaries.** Repositories and network/AI clients return `Result<T, AppError>`. `AppError`
carries `code`, `retryable`, `meta` (no PII) and `userMessageKey`, so retries, offline fallbacks and UI errors stay generic.
Non-`AppError` throws from transports are treated as retryable network errors.

**4. State placement.** Redux Toolkit holds only shell and shared/persisted state (typed via `RootStateRegistry`
augmentation). Screen state lives in `ViewModel`/`MviStore`. Persistence is in-house (allow-list, versioned
snapshots, migrations) rather than redux-persist.

**5. Vendor-neutral AI.** The app depends on the `AIClient` port and logical model tiers; the backend holds keys and
picks models. Tools call use cases; mutating tools require confirmation.

**6. Local typed translation keys.** `useTranslation<typeof en>()` checks keys per feature instead of a global
augmentation that would couple every module.

**7. The framework lives inside the app.** The repo root is the Expo app (single `package.json`). The framework is
`src/framework`, imported via `@framework/*`, and its layering lives in `layers.json` (lint-enforced). There's no publishing
overhead and refactors are atomic. Extract it into a package only when a second app needs it.

**8. Layered feature flags.** One registry; module flags gate whole modules (and their tabs) at boot, runtime flags are
read live. Precedence: default < brand < environment < remote < device override < env var. Overrides are disabled in production.

**9. Lean by default.** No docs site, no community boilerplate, one example brand. Everything shipped is either
used by the app or directly helps build it.
