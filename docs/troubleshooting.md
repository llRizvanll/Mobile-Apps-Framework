---
title: Troubleshooting
description: Fixes for common problems with the React Native monorepo — Metro and workspace resolution, Jest and React Native Testing Library v14, exactOptionalPropertyTypes errors, RTL reloads, streaming AI responses and ESLint boundary errors.
---

# Troubleshooting

### `Cannot find module '@brands/<id>'` after generating a brand

Run `npm install` from the repo root to link the new workspace.

### RNTL: `render function has not been called` / `screen` is empty

React Native Testing Library **v14** has async APIs. Use `await render(...)` and `await fireEvent.press(...)`.

### `… is not assignable … with 'exactOptionalPropertyTypes: true'`

You passed `undefined` to an optional property. Spread it conditionally:

```ts
{ ...(testID ? { testID } : {}) }
```

### ESLint: `@org/x may not depend on @org/y`

This is an architecture boundary. If the dependency is intended, add it to the package's `package.json` `dependencies` (the rule is generated from it) and check the [layer graph](./architecture.md). Otherwise, move the code to the right layer.

### ESLint: `domain/ must stay framework-free`

Move React, HTTP or storage code into `data/` or `presentation/`, and define a port in `domain/`.

### Switching to Arabic doesn't flip the layout

Native layout direction only changes after a reload. `syncLayoutDirection` calls `requestReload` (the example uses `DevSettings.reload()`; use `expo-updates` `reloadAsync` in release builds).

### AI streaming falls back to a single chunk

`createHttpProxyAIClient` needs a streaming-capable fetch (`fetch` from `expo/fetch`) and `ai.streamUrl` in the brand config. Otherwise it degrades to `complete()`.

### Jest: "A worker process has failed to exit gracefully"

An app created outside `createTestApp` wasn't stopped. Call `await app.stop()`, or use `createTestApp`, which cleans up automatically.

### Watchman "Recrawled this watch" warning

```bash
watchman watch-del "$PWD" ; watchman watch-project "$PWD"
```

### Metro can't resolve a workspace package

Check that the package's `package.json` has `main`/`react-native`/`exports` pointing at `src/index.ts(x)` and that the file extension matches.
