---
title: 'ADR 0005: State placement'
description: 'Where state lives: Redux Toolkit for shell state, view models and MVI stores for screen state, custom persistence.'
---

# 0005 — Where state lives

**Decision**:

- **Redux (RTK)**: shell state (`app`, `session`, `settings`) and cross-feature/persisted state.
  Slices extend `RootStateRegistry` by declaration merging, so `useAppSelector` is typed without a
  central root file. Thunks/listeners receive the DI resolver.
- **ViewModel / MviStore**: screen and flow state — created per screen, disposed on unmount.
- **Persistence**: in-house (≈100 lines) instead of redux-persist: explicit allow-list, versioned
  snapshots + migrations, throttled writes, rehydration of lazily injected slices.
- **Server cache**: repositories (+ decorators). RTK Query can be added per feature if desired.
