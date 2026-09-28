# @framework/testing

Test harness for apps, features and brands.

```tsx
const { http, analytics, crash, spans } = await renderWithFramework(<Screen />, {
  modules: [todosModule],
  mockHttp: (http) => http.on('GET', '/todos', { data: { items: [] } }),
});
```

- `createTestApp(options)` — fully wired app with observable doubles (`MockTransport`, memory stores, `MemoryAnalyticsProvider`, `MemorySink`, `MemorySpanExporter`, `RecordingCrashReporter`).
- `createTestBrand(overrides)`, `createFakeSocketFactory()`, `ScriptedAIClient`, `ManualClock`.
