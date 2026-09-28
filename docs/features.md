# Building features

```bash
npm run gen:feature -- orders [--entity Order] [--flag [--on]]
```

This generates `src/features/orders/` (a full vertical slice with tests), registers it in `src/app/modules.ts`, and adds
its tab. With `--flag` it also adds a module flag (off unless `--on`). Copy patterns from `src/features/todos`.

## Anatomy

```text
features/orders/
├── domain/        Order.ts (entity + rules) · OrderRepository.ts (port) · usecases.ts   ← pure TypeScript
├── data/          dto.ts (zod) · RestOrderRepository.ts (adapter)                        ← HttpClient, storage
├── presentation/  OrdersViewModel.ts · OrdersScreen.tsx                                  ← React, @framework/ui
├── ai/tools.ts    capabilities for the in-app assistant (call the same use cases)
├── tokens.ts · translations.ts
├── module.ts      DI bindings · flag · tab · translations · tools · reducers/persist
└── __tests__/
```

Dependencies point inward: `presentation → domain ← data`. Lint blocks the rest.

## Checklist

1. **Domain**: entity and rules return `Result`, never throw. Use `Branded` ids. The use case has one `execute`.
2. **Data**: pass a zod schema as `parser` to `HttpClient` (bad payloads become `validation` errors); map DTO → domain.
3. **DI**: tokens in `tokens.ts`; `c.bind(GetOrdersToken).toClass(GetOrders, [OrderRepositoryToken] as const)`.
4. **Presentation**: `ViewModel` for CRUD screens, `MviStore` for state machines. Use `@framework/ui` components, theme tokens, and `useTranslation<typeof en>()` (keys checked at compile time). Show errors via `userMessageKey`.
5. **Module**:
   ```ts
   export const ordersModule = defineModule({
     id: 'orders',
     featureFlag: flag('orders'),
     dependsOn: ['auth'],
     register(c) {
       /* bindings */
     },
     reducers: { cart: cartSlice.reducer },
     persist: ['cart'], // only for shared/persisted state
     translations: { en, ar },
     tools: ordersTools,
     tabs: [{ key: 'orders', titleKey: 'orders.tab', component: OrdersScreen, order: 30 }],
     onStart: async ({ resolver }) => {
       /* warm caches, subscriptions */
     },
   });
   ```
6. **Flags**: `useFlag('orders.newCheckout')` for behaviour inside screens ([feature flags](feature-flags.md)).
7. **Mock API**: add `route('GET', '/orders/:id', (req, { id }) => ({ data: … }))` to `mockRoutes` in `src/app/bootstrap/mockBackend.ts` so mock mode keeps working.
8. **Tests** (below), then `npm run verify`.

## MVVM or MVI?

|                   | `ViewModel`                                     | `MviStore`                                                              |
| ----------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| Changes state via | methods (`vm.add()`)                            | intents (`dispatch({ type: 'send' })`) through a pure reducer           |
| Async             | `launch()` / async methods (aborted on unmount) | `effects(intent, ctx)`                                                  |
| One-off events    | callbacks                                       | `emit(effect)` + `useMviEffects`                                        |
| Use for           | lists, details, forms                           | chat, checkout, onboarding, anything that needs an auditable intent log |

Both are React-free. Bind them with `useViewModel(() => new VM(...))` / `useMvi(() => createStore(...))`.

## Testing

| Level             | How                                                            | Example                                    |
| ----------------- | -------------------------------------------------------------- | ------------------------------------------ |
| Domain / use case | fake repository returning `ok`/`err`                           | `todos/__tests__/domain.test.ts`           |
| ViewModel / MVI   | `vm.attach()` + tick; `store.dispatch`                         | `viewmodel.test.ts`, `assistant/__tests__` |
| Data              | `createHttpClient({ transport: stub })`                        | `data.test.ts`                             |
| Integration       | `renderWithFramework(<Screen/>, { modules, mockHttp, flags })` | `TodoListScreen.test.tsx`                  |
| Composition       | `bootstrapApplication(env, adapters)`                          | `src/app/__tests__/`                       |

RNTL v14 is async (`await render`, `await fireEvent.press`). `createTestApp` exposes observable doubles (`http`,
`analytics`, `logs`, `spans`, `crash`) and stops apps automatically. Assert behaviour, not exact module or tab lists.

## Extension points

| Add                             | Via                                                       |
| ------------------------------- | --------------------------------------------------------- |
| HTTP concern (signing, headers) | `c.bindMulti(HttpMiddlewareToken).toValue(mw)`            |
| Log destination                 | `c.bindMulti(LogSinkToken)` or `adapters.logSinks`        |
| Typed analytics events          | augment `AnalyticsEventMap` in `@framework/observability` |
| Typed global state              | augment `RootStateRegistry` in `@framework/state`         |
| Brand-overridable component     | augment `UIComponentMap` + `createOverridable`            |
| Reusable capability             | a new framework module + `layers.json` entry + README     |
