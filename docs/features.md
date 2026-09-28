---
title: Building features
description: 'Checklist for building clean-architecture React Native features: domain rules, repository ports, zod DTOs, dependency injection, MVVM or MVI, i18n, AI tools and tests.'
---

# Building a feature

```bash
npm run gen:feature -- <kebab-name> [--entity Name] [--flag]
```

Generates the full vertical slice (see [architecture.md](architecture.md#feature-architecture-clean-architecture))
and registers the module in `apps/example/src/bootstrap/createApplication.ts`.
The reference implementation is `apps/example/src/features/todos` — copy its patterns.

## Checklist

1. **Domain first** — entity + validation rules return `Result`, never throw. Use `Branded` ids.
2. **Port** — `domain/XRepository.ts` describes what the domain needs, in domain types.
3. **Use cases** — one class, one `execute`, constructor-injected ports. UI and AI tools both call these.
4. **Data** — zod DTO schema passed as `parser` to `HttpClient` (bad payloads become `validation` errors),
   mapper to domain, repository adapter. Add decorators (cache, offline) as separate classes.
5. **DI** — tokens in `tokens.ts`; bind in `module.ts` with `toClass(Impl, [DepToken] as const)`.
6. **Presentation** — `ViewModel` or `MviStore`; screens use `@org/ui` components only, copy via
   `useTranslation<typeof en>()` (keys are compile-time checked), errors as i18n keys (`userMessageKey`).
7. **AI** — expose capabilities as tools; mark side-effecting tools `requiresConfirmation: true`.
8. **Tests** — domain & VM unit tests with fake repos; data tests with a stub transport; one
   integration test via `renderWithFramework` + `mockHttp`.
9. **Flags** — gate unfinished features with `featureFlag` and enable per brand.

## Rules of thumb

- Redux holds **app-wide, persisted or cross-feature** state only. Screen state lives in VMs/MVI stores.
- Never store secrets in Redux or `KeyValueStore` — use `SecureStoreToken`.
- Never hard-code colours/spacing — use theme tokens. Never hard-code copy — use translations.
- Never import a native module outside `bootstrap/adapters.ts`.
