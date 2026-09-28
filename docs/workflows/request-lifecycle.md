---
title: Request lifecycle (REST, GraphQL, WebSocket)
description: The React Native HTTP pipeline step by step — middleware order, W3C traceparent tracing, retries with backoff and Retry-After, single-flight OAuth token refresh on 401, typed Result errors, GraphQL queries and graphql-ws subscriptions with automatic reconnect.
---

# Request lifecycle

**Source**: [`packages/network/src`](https://github.com/llRizvanll/Mobile-Apps-Framework/tree/main/packages/network/src), wiring in [`packages/core/src/services.ts`](https://github.com/llRizvanll/Mobile-Apps-Framework/blob/main/packages/core/src/services.ts)

## The pipeline

Middleware runs outermost-first. Each layer can change the request, short-circuit, retry, or translate errors.

```mermaid
flowchart LR
  C["repo.list()<br/>http.get /todos + parser"] --> H[withHeaders<br/>X-Brand · Accept-Language · version]
  H --> TR[tracing<br/>span + traceparent]
  TR --> L[logging]
  L --> RT[retry<br/>idempotent · backoff · Retry-After]
  RT --> AU[auth<br/>Bearer · refresh on 401]
  AU --> MM[module middleware<br/>HttpMiddlewareToken]
  MM --> ST[status check<br/>non-2xx → HttpError]
  ST --> TP[(HttpTransport<br/>fetch · mock · pinned)]
  TP -.->|response| ST
  ST -.->|parser.parse| V{valid?}
  V -- yes --> OK["Ok(response)"]
  V -- no --> VE["Err(validation)"]
```

**Nothing throws to the caller.** The client always returns `Result<HttpResponse<T>, AppError>`:

| Failure                                     | `error.code`                               | `retryable` |
| ------------------------------------------- | ------------------------------------------ | ----------- |
| No connectivity / DNS / raw transport throw | `network`                                  | ✅          |
| Timeout                                     | `timeout`                                  | ✅          |
| 401 / 403 / 404                             | `unauthorized` / `forbidden` / `not_found` | ❌          |
| 408, 429, 5xx                               | `http`                                     | ✅          |
| Payload failed the zod schema               | `validation`                               | ❌          |
| Caller aborted                              | `aborted`                                  | ❌          |

## Token refresh (single flight)

When several requests fail with 401 at the same time, there is **one** refresh, and each request is replayed once.

```mermaid
sequenceDiagram
  autonumber
  participant A as Request A
  participant B as Request B
  participant MW as auth middleware
  participant RP as AuthRefreshPort
  participant API
  A->>MW: GET /me
  B->>MW: GET /todos
  MW->>API: Bearer old (A)
  MW->>API: Bearer old (B)
  API-->>MW: 401 (A)
  API-->>MW: 401 (B)
  MW->>RP: refresh()  (A starts it)
  Note over MW,RP: B joins the same in-flight promise
  RP-->>MW: true
  MW->>API: replay A with Bearer new (authRetried)
  MW->>API: replay B with Bearer new
  API-->>A: 200
  API-->>B: 200
  Note over MW: if refresh() is false → onRefreshFailed() (e.g. sign out) and the original 401 is returned
```

Your auth feature binds two ports: `AccessTokenProviderToken` (read the token, usually from `SecureStoreToken`) and `AuthRefreshPortToken`.

## Retry policy

```mermaid
flowchart TD
  E[error] --> Q1{"meta.retry === false?"}
  Q1 -- yes --> F[fail]
  Q1 -- no --> Q2{"attempts < max?<br/>(default 2 for GET/PUT/DELETE, 0 for POST/PATCH)"}
  Q2 -- no --> F
  Q2 -- yes --> Q3{"error.retryable?"}
  Q3 -- no --> F
  Q3 -- yes --> W["wait Retry-After or<br/>exponential backoff + jitter"] --> R[retry]
```

## GraphQL

Queries and mutations go through the **same** `HttpClient`, so auth, tracing and logging apply to them unchanged. Mutations are never retried automatically. With `errorPolicy: 'none'` (the default), any GraphQL error returns `Err(graphql)`; an `UNAUTHENTICATED` extension maps to `unauthorized`.

## WebSocket and subscriptions

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> connecting: connect()
  connecting --> open: onopen → flush queue, start heartbeat
  open --> reconnecting: unexpected close
  reconnecting --> connecting: after backoff delay
  reconnecting --> closed: maxAttempts reached
  open --> closed: disconnect()
  closed --> connecting: connect()
```

`GraphQLSubscriptionClient` speaks `graphql-transport-ws`. On each `open` it sends `connection_init` (with a fresh bearer token), waits for `connection_ack`, then **re-subscribes every active subscription**. That makes reconnects invisible to screens.
