# @framework/core

Composition root: brand config, modules, kernel, FrameworkProvider.

```ts
const app = createApp({ brand, environment: 'production', modules: [authModule, todosModule], adapters });
<FrameworkProvider app={app} splash={<Splash />}>{children}</FrameworkProvider>
```

- `defineBrand({ config, environments, theme, translations, components, modules })`; `resolveBrandConfig` validates with zod and lists every issue.
- `defineModule({ id, dependsOn, featureFlag, register, reducers, translations, tools, onStart, onStop })` — topo-sorted, flag-gated.
- `PlatformAdapters`: every native/vendor binding, all optional with in-memory/no-op defaults.
- Hooks: `useFramework`, `useBrandConfig`, `useFeatureFlag(key)`, `useInject`, `useResolver`.
- `app.onLifecycle(...)`, `app.stop()` (flushes persistence, disposes container).
