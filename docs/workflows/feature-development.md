---
title: Feature development workflow
description: Step-by-step workflow to build a React Native feature with clean architecture — generator scaffolding, domain use cases, zod DTOs, repositories, MVVM view models, screens, AI tools, tests and pull request checks.
---

# Feature development

```mermaid
flowchart TD
  I([Idea / ticket]) --> G["npm run gen:feature -- orders --flag"]
  G --> D["domain/<br/>entity · rules · port · use cases"]
  D --> DT["unit tests with a fake repository"]
  DT --> DA["data/<br/>zod DTO · mapper · REST repository"]
  DA --> DAT["data tests with a stub transport"]
  DAT --> P["presentation/<br/>ViewModel or MviStore + screen"]
  P --> PT["VM tests + renderWithFramework integration test"]
  PT --> AI["ai/tools.ts<br/>expose capabilities"]
  AI --> FL["enable flag per brand"]
  FL --> V{"npm run verify"}
  V -- fails --> P
  V -- passes --> PR([Pull request])
  PR --> CI{"CI: format · typecheck · lint · tests · bundle ×brands"}
  CI -- green --> M([Merge])
```

## Dependency rule

```mermaid
flowchart LR
  P[presentation] --> D[domain]
  DA[data] --> D
  AI[ai tools] --> D
  M[module.ts] --> P & DA & AI
  D -.->|✗ never imports| X[React · RN · Redux · HTTP · storage]
```

ESLint enforces this. For example, importing `@org/network` from `domain/` fails lint with _"domain/ defines ports; data/ implements them."_

## Choosing MVVM vs MVI

| Signal                                                                                  | Pick                                |
| --------------------------------------------------------------------------------------- | ----------------------------------- |
| List/detail/form, a handful of commands                                                 | **ViewModel** (`TodoListViewModel`) |
| Explicit states and transitions, async orchestration, a need to replay or audit intents | **MviStore** (`assistantStore`)     |

Both are plain classes/functions with no React, so tests run without rendering.

## Definition of done

- [ ] Domain rules return `Result`; user-facing errors carry `userMessageKey`
- [ ] Every locale the target brands support has translations (typed with `Shape<typeof en>`)
- [ ] No hard-coded colours, spacing or copy
- [ ] Mutating AI tools set `requiresConfirmation: true`
- [ ] Tests at domain, data and integration level
- [ ] `npm run verify` is green

See also: [Building features](../features.md) · [Testing strategy](./testing.md)
