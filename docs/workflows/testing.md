---
title: Testing strategy
description: Testing a React Native clean architecture app with Jest and React Native Testing Library — fast unit tests for domain and view models, data layer tests with stub transports, and integration tests with a fully booted in-memory app.
---

# Testing strategy

```mermaid
flowchart TB
  subgraph pyramid [" "]
    direction TB
    E2E["E2E on device (Maestro/Detox) — few, per brand smoke"]
    INT["Integration — renderWithFramework + mockHttp<br/>UI → VM → use case → repo → HTTP"]
    DATA["Data — repositories with stub HttpTransport<br/>DTO validation · offline cache"]
    UNIT["Unit — domain rules, use cases, ViewModels, MVI reducers<br/>plain TS, fakes, no rendering"]
  end
  E2E --- INT --- DATA --- UNIT
```

| Layer             | Tool                                            | Example                                     |
| ----------------- | ----------------------------------------------- | ------------------------------------------- |
| Domain / use case | Jest (`*.test.ts`, Node env)                    | `features/todos/__tests__/domain.test.ts`   |
| ViewModel / MVI   | Jest + fakes                                    | `viewmodel.test.ts`, `assistant.test.ts`    |
| Data              | `createHttpClient({ transport })`               | `data.test.ts`                              |
| Integration       | `renderWithFramework` (`*.test.tsx`, RN preset) | `TodoListScreen.test.tsx`                   |
| Brand contract    | Jest                                            | `brands/acme/src/__tests__/brands.test.tsx` |

## Integration harness

```tsx
const { http, analytics, crash, spans } = await renderWithFramework(<TodoListScreen />, {
  modules: [todosModule],
  mockHttp: (http) => http.on('GET', '/todos', { data: { items: [] } }),
});
```

`createTestApp` wires **every** platform adapter to an observable in-memory double. Apps created in a test are stopped automatically after each test.

## Two Jest projects

| Project  | Matches                      | Environment                 |
| -------- | ---------------------------- | --------------------------- |
| `unit`   | `**/__tests__/**/*.test.ts`  | Node (fast)                 |
| `native` | `**/__tests__/**/*.test.tsx` | `@react-native/jest-preset` |

> React Native Testing Library v14 APIs are async: `await render(...)`, `await fireEvent.press(...)`.
