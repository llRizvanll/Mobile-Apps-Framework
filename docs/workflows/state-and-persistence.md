---
title: State management & persistence
description: Where state lives in the React Native framework — Redux Toolkit shell slices, MVVM view models and MVI stores for screen state, versioned persistence with migrations, secure token storage and repository caching.
---

# State & persistence

## Where does this state go?

```mermaid
flowchart TD
  Q0{What kind of state?} --> Q1{"Secret?<br/>(tokens, credentials)"}
  Q1 -- yes --> SS["SecureStoreToken<br/>Keychain / Keystore"]
  Q1 -- no --> Q2{"Needed by several features,<br/>or must survive restarts?"}
  Q2 -- yes --> RX["Redux slice<br/>(+ persistence whitelist)"]
  Q2 -- no --> Q3{"Server data?"}
  Q3 -- yes --> RP["Repository<br/>(+ cache decorator)"]
  Q3 -- no --> Q4{"Multi-step flow /<br/>state machine?"}
  Q4 -- yes --> MVI["MviStore"]
  Q4 -- no --> VM["ViewModel"]
```

| Layer                | Examples                                  | Lifetime         |
| -------------------- | ----------------------------------------- | ---------------- |
| `app` slice          | boot phase, foreground/background, online | session          |
| `session` slice      | auth status, user id (**no tokens**)      | persisted        |
| `settings` slice     | theme, locale, analytics consent          | persisted        |
| Feature slices       | cart, drafts shared across screens        | opt-in persisted |
| ViewModel / MviStore | form input, list state, loading flags     | screen           |
| Repository cache     | last good list for offline use            | `KeyValueStore`  |

## Persistence flow

```mermaid
sequenceDiagram
  autonumber
  participant UI
  participant S as Store
  participant P as persistence middleware
  participant KV as KeyValueStore (namespaced per brand)
  UI->>S: dispatch(themePreferenceChanged('dark'))
  S->>P: next(action)
  P->>P: whitelisted slice changed? → throttle 500 ms
  P->>KV: setItem('state', { version, state })
  Note over UI,KV: next launch
  S->>KV: restore()
  KV-->>S: snapshot (version 1)
  S->>S: migrate(1 → 2) if versions differ
  S->>S: REHYDRATE → shallow-merge into slices
```

- **Lazy slices**: `injectReducer(key, reducer)` adds a slice at runtime and immediately rehydrates its persisted state.
- **Migrations**: bump `version` and supply `migrate(state, fromVersion)`. Snapshots that can't be migrated are dropped, not crashed on.
- **Flush**: `app.stop()` writes pending state immediately.

## Shell side effects

The kernel listens to shell actions so features don't have to:

| Action                             | Effect                                     |
| ---------------------------------- | ------------------------------------------ |
| `settings/localeChanged`           | `i18n.setLocale` + RTL sync                |
| `settings/analyticsConsentChanged` | enable/disable all analytics providers     |
| `session/signedIn`                 | crash reporter user + `analytics.identify` |
| `session/signedOut`                | clear crash user + `analytics.reset`       |
