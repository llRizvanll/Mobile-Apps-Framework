# @org/network

REST, GraphQL and WebSocket clients with a middleware pipeline.

```ts
const res = await http.get('/me', { parser: userSchema });         // Result<HttpResponse<User>, AppError>
const data = await gql.query(GetUserDocument, { id });             // typed via graphql-codegen (documentMode: 'string')
subs.subscribe(OnMessage, { room }, { next: (d) => ... });         // graphql-transport-ws, auto-resubscribe
ws.send({ type: 'hello' }); ws.onMessage(handle);                   // backoff reconnect, offline queue, heartbeat
```

Middleware (outermost first): `withHeaders`, `tracing`, `logging`, `retry` (idempotent + Retry-After),
`auth` (bearer + **single-flight refresh on 401** + replay once). Add your own via `HttpMiddlewareToken`.

Ports to bind in your auth feature: `AccessTokenProviderToken`, `AuthRefreshPortToken`.
Swap I/O with `HttpTransport` (tests, pinning) and `WebSocketFactory`.
