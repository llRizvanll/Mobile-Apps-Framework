# @framework/foundation

Zero-dependency primitives shared by every package.

```ts
import {
  ok,
  err,
  tryCatch,
  AppError,
  Emitter,
  createObservableStore,
  deepMerge,
  singleFlight,
  backoffDelay,
} from '@framework/foundation';

const r = await tryCatch(() => load()); // Result<T, Error>
if (!r.ok)
  throw new AppError('network', 'offline', { retryable: true, userMessageKey: 'errors.offline' });
```

- `Result<T, E>` + `ok/err/mapResult/andThen/match/unwrap`
- `AppError` (`code`, `retryable`, `meta`, `userMessageKey`) — the only error type crossing packages
- `Emitter<Events>`, `createObservableStore` (useSyncExternalStore-compatible)
- `deepMerge` (arrays replace), `deepFreeze`, `sleep(ms, signal)`, `backoffDelay`, `singleFlight`, `Clock`/`ManualClock`
- Types: `Branded`, `DeepPartial`, `Parser<T>` (zod-compatible), `Json`, `Disposable`
