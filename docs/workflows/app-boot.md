---
title: App boot workflow
description: How a React Native app built on the framework starts — brand config validation, dependency injection container, Redux rehydration, locale and RTL detection, remote feature flags, AI tool registration and module lifecycle.
---

# App boot

**Source**: [`packages/core/src/kernel.ts`](https://github.com/llRizvanll/Mobile-Apps-Framework/blob/main/packages/core/src/kernel.ts), [`FrameworkProvider.tsx`](https://github.com/llRizvanll/Mobile-Apps-Framework/blob/main/packages/core/src/react/FrameworkProvider.tsx), [`apps/example/src/bootstrap/`](https://github.com/llRizvanll/Mobile-Apps-Framework/tree/main/apps/example/src/bootstrap)

Boot has two phases. The **synchronous** phase (`createApp`) fails fast on configuration errors. The **asynchronous** phase (`app.start()`) does I/O, and each step is traced.

## 1. Composition (synchronous)

```mermaid
flowchart TD
  A["createApplication(env, adapters)"] --> B{"brand id known?"}
  B -- no --> X1["throw: Unknown brand"]
  B -- yes --> C["resolveBrandConfig(brand, environment)<br/>base ⊕ environment overlay"]
  C --> D{"zod valid?"}
  D -- no --> X2["AppError('config') listing every invalid field"]
  D -- yes --> E["deepFreeze(config)"]
  E --> F["resolveModules(modules, config.features)<br/>flag filter → topological sort"]
  F --> G{"missing dependency or cycle?"}
  G -- yes --> X3["AppError('config')"]
  G -- no --> H["Container ← frameworkServices<br/>(logger, analytics, storage, i18n, http, gql, ws, ai)"]
  H --> I["module.register(container) for each module"]
  I --> J["overrides(container) — tests / debug"]
  J --> K["createPersistence + createAppStore<br/>(shell slices + module reducers)"]
  K --> L["FrameworkApp"]
```

Services are registered as **lazy factories**. Nothing is instantiated until first use, so a module can still override a binding (for example `AccessTokenProviderToken`) before the HTTP client is built.

## 2. Start (asynchronous, traced)

```mermaid
sequenceDiagram
  autonumber
  participant P as FrameworkProvider
  participant K as Kernel (app.start)
  participant S as Store
  participant I as I18n
  participant F as FeatureFlags
  participant R as ToolRegistry
  participant M as Modules
  P->>K: start() (idempotent, shared promise)
  K->>K: crash tags + global error handler
  K->>S: dispatch(REHYDRATE from storage)
  Note right of K: span app.start.rehydrate
  K->>I: setLocale(persisted ▸ device ▸ default)
  K->>K: syncLayoutDirection (RTL)
  Note right of K: span app.start.locale
  K->>F: refresh() from RemoteConfigProvider
  K->>K: apply analytics consent
  K->>R: register DI + module tools
  K->>S: start shell listeners (locale, consent, session)
  loop dependency order
    K->>M: onStart(context)
  end
  K->>S: bootSucceeded → phase = ready
  S-->>P: re-render: splash → app
```

If any step throws, the kernel dispatches `bootFailed`, reports to the crash reporter, and resets so that **Retry** calls `start()` again.

## 3. What the provider renders

```mermaid
stateDiagram-v2
  [*] --> booting
  booting --> ready: bootSucceeded
  booting --> failed: bootFailed
  failed --> booting: retry → start()
  ready --> ready: render error → ErrorBoundary → CrashReporter
```

Provider nesting: `Redux → DI Container → I18n → Theme (persisted preference) → UI overrides → ErrorBoundary → your app`.

## Shutdown

`app.stop()` is idempotent. It runs `onStop` on modules in reverse dependency order, removes listeners, **flushes persistence**, and disposes the container (any `Disposable` singletons).
