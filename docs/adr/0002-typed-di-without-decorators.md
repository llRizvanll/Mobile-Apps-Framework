# 0002 — Typed DI without decorators

**Status**: accepted

**Decision**: A small container keyed by `Token<T>` (phantom-typed symbols). Class bindings list
dependencies explicitly: `toClass(Impl, [A, B] as const)` — the tuple is type-checked against the
constructor. Lifetimes: singleton / scoped / transient. Multi-bindings for plugin points.

**Why not Inversify/tsyringe**: decorators + `reflect-metadata` add Babel config, bundle size and
Hermes edge cases, and erase types at the token boundary.

**Consequences**: + fully inferred `get(token)`; + circular-dependency errors show the path; −
dependency lists are written by hand (the generator writes them).
