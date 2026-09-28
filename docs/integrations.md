# Integrations

The only file that touches native or vendor SDKs is `src/app/bootstrap/adapters.ts`. Everything else talks to ports.

## REST

```ts
const res = await http.get('/orders', { parser: orderListSchema, query: { page: 2 } });
if (!res.ok) return res; // AppError: network | timeout | unauthorized | http | validation …
return ok(res.value.data.items.map(toDomain));
```

Every request carries `X-Brand`, `X-App-Version`, `Accept-Language` and a W3C `traceparent`. Base URL, timeout and
static headers come from the brand config.

## Authentication

The network layer asks for two ports. Implement them in an `auth` feature module:

```ts
export const authModule = defineModule({
  id: 'auth',
  register(c) {
    c.bind(AccessTokenProviderToken).toFactory((r) => ({
      getAccessToken: () => r.get(SecureStoreToken).getItem('auth.accessToken'),
    }));
    c.bind(AuthRefreshPortToken).toFactory((r) => ({
      async refresh() {
        const secure = r.get(SecureStoreToken);
        const refreshToken = await secure.getItem('auth.refreshToken');
        if (!refreshToken) return false;
        const res = await r
          .get(HttpClientToken)
          .post<Tokens>('/auth/refresh', { refreshToken }, { meta: { skipAuth: true } });
        if (!res.ok) return false;
        await secure.setItem('auth.accessToken', res.value.data.accessToken);
        await secure.setItem('auth.refreshToken', res.value.data.refreshToken);
        return true;
      },
      onRefreshFailed: () => r.get(AppStoreToken).dispatch(sessionSlice.actions.signedOut()),
    }));
  },
});
```

After login, dispatch `sessionSlice.actions.signedIn({ userId })`. The crash reporter user and analytics identity follow automatically.
Modules that need auth declare `dependsOn: ['auth']`.

## GraphQL & WebSocket

Add `graphql: { url, wsUrl }` or `websocket: { url }` to the brand config, then:

```ts
resolver.get(GraphQLClientToken).query(GetOrderDocument, { id }); // typed via codegen (documentMode: 'string')
resolver.get(GraphQLSubscriptionClientToken).subscribe(OnOrderUpdated, { id }, { next });
resolver.get(WebSocketClientToken).send({ type: 'hello' }); // reconnect + offline queue built in
```

## AI backend contract

`POST {rest.baseUrl}{ai.path}` receives a vendor-neutral `ChatRequest` (`messages`, `system`, `model` tier, `tools`,
`metadata`) and returns a `ChatResponse` (`content` parts incl. `tool_call`, `stopReason`, `usage`). Your backend holds
the vendor keys, maps tiers (`fast`/`balanced`/`smart`) to models, and applies quotas and safety. Optional streaming:
an SSE endpoint (`ai.streamUrl`) emitting `ChatStreamEvent` JSON. See `src/framework/ai/types.ts`.

## Vendors (swap in `adapters.ts`)

| Concern           | Default           | Swap to                                                                         |
| ----------------- | ----------------- | ------------------------------------------------------------------------------- |
| Key-value storage | AsyncStorage      | MMKV: `createMMKVStore(new MMKV())`                                             |
| Secure storage    | expo-secure-store | any `SecureStore`                                                               |
| Database          | —                 | `createExpoSQLiteDatabase(db)` + `runMigrations`                                |
| Crash reporting   | no-op             | Sentry, Crashlytics… (implement `CrashReporter`: 5 methods)                     |
| Analytics         | none              | Segment, Amplitude, Firebase… (`AnalyticsProvider`: 4 methods; several allowed) |
| Remote config     | none              | Firebase RC, LaunchDarkly… (`RemoteConfigProvider.fetch()`)                     |
| HTTP transport    | `fetch`           | certificate pinning / native stacks (`HttpTransport`)                           |
| Navigation        | module tab shell  | expo-router / React Navigation: map `useModuleTabs()` to routes                 |

```ts
// Sentry example
crashReporter: {
  captureException: (e, ctx) => Sentry.captureException(e, { extra: ctx }),
  captureMessage: (m, level) => Sentry.captureMessage(m, level),
  addBreadcrumb: (b) => Sentry.addBreadcrumb(b),
  setUser: (u) => Sentry.setUser(u),
  setTag: (k, v) => Sentry.setTag(k, v),
},
```

Install native SDKs with `npx expo install <pkg>`, add their config plugin to `app.config.ts`, and rebuild natively.
