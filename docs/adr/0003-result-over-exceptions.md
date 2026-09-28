---
title: 'ADR 0003: Result over exceptions'
description: Why data-layer APIs return Result values and a typed AppError instead of throwing.
---

# 0003 — `Result` at data boundaries

**Decision**: Repositories, HTTP/GraphQL clients and AI clients return `Result<T, AppError>`. Throwing
is reserved for programmer errors and middleware internals. `AppError` carries `code`, `retryable`,
`meta` (non-PII) and `userMessageKey` (i18n) so retry policies, offline fallbacks and UI copy are generic.
Non-`AppError` throws from transports are normalised to retryable `network` errors.

**Consequences**: failure paths are visible in types and tested; view models map errors to i18n keys.
