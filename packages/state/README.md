# @org/state

Redux Toolkit store factory, persistence and shell slices.

```ts
declare module '@org/state' {
  interface RootStateRegistry {
    cart: CartState;
  }
} // typed RootState, no central file
const items = useAppSelector((s) => s.cart.items);
const thunk: AppThunk = async (dispatch, getState, { resolver }) =>
  resolver.get(CheckoutToken).execute();
```

- Shell slices: `app` (boot phase, activity, online), `session` (status, userId — no tokens), `settings` (theme, locale, consent).
- `createPersistence({ storage, whitelist, version, migrate })` — versioned snapshots, throttled writes.
- `injectReducer(key, reducer)` for lazy modules (rehydrates persisted state for that slice).
- `listener` (RTK listener middleware) with DI resolver as `extra`.
