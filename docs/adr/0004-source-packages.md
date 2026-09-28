# 0004 — Packages ship TypeScript source

**Decision**: Inside the monorepo, `@org/*` `main`/`exports` point at `src/index.ts`. Metro, Jest and
`tsc` consume source directly — no build/watch step, instant cross-package refactors.

**Publishing**: when brands move to separate repos, add a build (e.g. `react-native-builder-bob` or
`tsup`) emitting ESM + `.d.ts` and switch `exports` to a `"react-native"`/`"types"`/`"default"` map.
