---
title: 'ADR 0001: Ports & adapters'
description: Why the framework uses ports and adapters with structural adapter types and no native dependencies.
---

# 0001 — Ports & adapters, structural adapter types

**Status**: accepted

**Context**: The framework must serve many apps and brands with different vendors (MMKV vs AsyncStorage,
Sentry vs Crashlytics, Segment vs Amplitude) and be testable without a device.

**Decision**: Every I/O capability is an interface (port) in its package. Adapters accept _structural_
types (`MMKVLike`, `ExpoSecureStoreLike`, `ExpoSQLiteLike`) instead of importing vendor packages, so
framework packages have zero native dependencies. Apps wire adapters in one file (`PlatformAdapters`).

**Consequences**: + vendor swaps don't touch features; + the kernel runs in Node/Jest; − adapters
must track vendor API changes structurally (type errors surface at the app's composition root).
