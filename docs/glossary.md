---
title: Glossary
description: Definitions of the terms used in the React Native framework — adapter, AppError, brand definition, composition root, feature module, MVI, MVVM, port, Result, token, tool and more.
---

# Glossary

| Term                    | Meaning                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| **Adapter**             | An implementation of a port for a specific vendor or runtime (for example `createMMKVStore`).        |
| **AppError**            | The framework's error type: `code`, `retryable`, `meta`, `userMessageKey`.                           |
| **Agent loop**          | `runAgent`: model → tool calls → results → model, until done or `maxSteps`.                          |
| **Brand**               | A package defining config, theme, copy, component overrides and native identity.                     |
| **Brand contract test** | A test asserting that every brand's config is valid in every environment and meets WCAG AA contrast. |
| **Composition root**    | The single place where the app is assembled (`apps/*/src/bootstrap`).                                |
| **Container**           | The DI container resolving `Token<T>` to instances with singleton, scoped or transient lifetimes.    |
| **Environment overlay** | A partial brand config merged over the base for `staging` or `production`.                           |
| **Feature module**      | `defineModule({...})`: the unit of composition (DI, reducers, translations, tools, lifecycle).       |
| **Feature flag**        | `config.features[key]`, optionally overridden by a `RemoteConfigProvider`; gates modules and UI.     |
| **Kernel**              | `createApp` + `start()`: validates, composes and boots the app.                                      |
| **Middleware**          | A function in the HTTP pipeline: `(request, next) => Promise<response>`.                             |
| **MVI**                 | Model–View–Intent: state changes only through intents and a pure reducer, with async effects.        |
| **MVVM**                | Model–View–ViewModel: a class holding screen state and exposing commands.                            |
| **Multi-binding**       | Several values bound to one token (`bindMulti` / `getAll`), used for plugin points.                  |
| **native.json**         | A brand's store identity, shared by the native build and the runtime config.                         |
| **Port**                | An interface the framework depends on (`KeyValueStore`, `AIClient`, `HttpTransport`…).               |
| **Result**              | `{ ok: true, value } \| { ok: false, error }` — explicit success or failure.                         |
| **Shell slices**        | The framework's Redux slices: `app`, `session`, `settings`.                                          |
| **Single flight**       | Concurrent callers share one in-flight promise (token refresh).                                      |
| **Token**               | `createToken<T>('name')`: a typed DI key.                                                            |
| **Tool**                | A capability exposed to AI (`defineTool`) that calls a use case.                                     |
| **Use case**            | A domain class with one `execute` method that depends only on ports.                                 |
| **UI slot**             | An overridable `@org/ui` component registered in `UIComponentMap`.                                   |
