# src/framework — rules for the built-in framework

The framework is **product-agnostic** infrastructure used by every feature. Treat it as an internal library.

- **Never** import `@app/*`, `@features/*`, `@brands/*` or `@config/*` from here. Dependencies point into the framework.
- Each module's allowed dependencies are declared in `layers.json`. Add an edge only with a real justification (and update `docs/architecture.md`).
- Every module has `index.ts` (the public API; consumers import `@framework/<module>` only), `README.md`, and `__tests__/`.
- Vendors stay behind **ports**: accept structural types (`MMKVLike`, `ExpoSecureStoreLike`), never import vendor SDKs.
- I/O returns `Result<T, AppError>`; `AppError` carries `code`, `retryable`, `meta` (no PII), `userMessageKey`.
- DI: expose tokens in `tokens.ts`; use multi-bindings for plugin points.
- Keep public APIs backward compatible; record breaking changes in `CHANGELOG.md`.
- Core boot changes (kernel, services, flags) need tests in `core/__tests__` or `testing/__tests__`, plus an update to the boot section of `docs/architecture.md`.
- Run `npm run verify`. Keep each module's `README.md` current (it is the module's reference doc).

Module map: foundation · di · observability · storage · network · state · i18n · theme · presentation · ui · ai · core · testing.
