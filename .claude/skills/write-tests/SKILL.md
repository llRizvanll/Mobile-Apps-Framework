---
name: write-tests
description: Write the right tests for this React Native app — domain and view-model unit tests, data-layer tests with stub transports, integration tests with renderWithFramework, flag and brand contract tests. Use when adding tests, fixing flaky tests or raising coverage.
---

# Write tests

Reference: `docs/features.md#testing`. Jest projects: `*.test.ts` → Node (fast), `*.test.tsx` → React Native preset.

| Layer               | Pattern                                                        | Example                                              |
| ------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| Domain / use case   | fake repository class returning `ok`/`err`                     | `src/features/todos/__tests__/domain.test.ts`        |
| ViewModel           | `vm.attach()`, await a tick, assert `vm.state`                 | `viewmodel.test.ts`                                  |
| MVI store           | `dispatch` intents, collect `onEffect`                         | `src/features/assistant/__tests__/assistant.test.ts` |
| Data                | `createHttpClient({ transport })` stub                         | `data.test.ts`                                       |
| Integration         | `renderWithFramework(<Screen/>, { modules, mockHttp, flags })` | `TodoListScreen.test.tsx`                            |
| Composition / flags | `bootstrapApplication(env, adapters)`                          | `src/app/__tests__/bootstrap.test.tsx`               |
| AI                  | `ScriptedAIClient([toolUseResponse(...), textResponse(...)])`  | assistant tests                                      |

## Rules

- RNTL v14 is async: `await render(...)`, `await fireEvent.press(...)`; flag changes inside `await act(() => flags.setOverride(...))`.
- Test behaviour through public APIs; don't assert exact module/tab lists (new features must not break unrelated tests). Use `arrayContaining`.
- `createTestApp` gives observable doubles: `http`, `analytics.events`, `logs.records`, `spans.spans`, `crash`. Apps are stopped automatically.
- No real network, timers leaking, or `setTimeout` sleeps longer than a tick.
- Run `npx jest path/to/file` while iterating, then `npm run verify`.
