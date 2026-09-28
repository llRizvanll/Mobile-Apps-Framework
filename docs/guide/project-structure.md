---
title: Project structure
description: Folder-by-folder guide to the React Native monorepo — framework packages, brand packages, the example Expo app, clean-architecture feature folders, generators, docs and tooling.
---

# Project structure

```text
Mobile-Apps-Framework/
├── packages/                 @org/* framework (TypeScript source, no build step in the monorepo)
│   ├── foundation/           Result, AppError, Emitter, ObservableStore, utils
│   ├── di/                   typed DI container (+ React hooks at @org/di/react)
│   ├── observability/        logger, crash reporter, analytics, tracer
│   ├── storage/              key-value, secure store, SQLite ports + adapters
│   ├── network/              HttpClient, middleware, GraphQL, WebSocket
│   ├── state/                Redux store factory, persistence, shell slices
│   ├── i18n/                 translations, plurals, RTL
│   ├── theme/                design tokens, light/dark, contrast audit
│   ├── presentation/         ViewModel (MVVM), MviStore (MVI)
│   ├── ui/                   atomic components + override registry
│   ├── ai/                   AIClient port, tools, agent loop, SSE
│   ├── core/                 BrandConfig, modules, kernel, FrameworkProvider
│   └── testing/              createTestApp, renderWithFramework, mocks
├── brands/
│   ├── acme/                 coral, pill buttons, en+ar (RTL), AI enabled
│   └── globex/               teal, square corners, en+fr, AI disabled
├── apps/example/             reference Expo app
│   ├── app.config.ts         per-brand native identity
│   └── src/
│       ├── bootstrap/        composition root: brands, adapters, mock backend
│       └── features/
│           ├── todos/        MVVM reference feature
│           ├── assistant/    MVI + AI agent reference feature
│           └── settings/
├── scripts/                  gen:feature, gen:brand, docs sync
├── docs/                     this site (VitePress)
├── tooling/                  shared tsconfig
├── .claude/skills/           skills for Claude Code
├── .github/                  CI, CodeQL, docs deploy, templates
├── AGENTS.md · CLAUDE.md · llms.txt
└── eslint.config.mjs         incl. generated architecture boundaries
```

## Anatomy of a feature

```text
features/todos/
├── domain/                   pure TypeScript — no React, Redux, HTTP, storage
│   ├── Todo.ts               entity + validation rules (Result)
│   ├── TodoRepository.ts     port
│   └── usecases.ts           GetTodos, AddTodo, ToggleTodo
├── data/
│   ├── dto.ts                zod schema + mapper
│   ├── RestTodoRepository.ts adapter
│   └── CachedTodoRepository.ts  decorator: offline cache
├── presentation/
│   ├── TodoListViewModel.ts  MVVM, React-free
│   └── TodoListScreen.tsx
├── ai/tools.ts               todos.list, todos.add
├── tokens.ts                 DI tokens
├── translations.ts           en, ar, fr (typed)
├── module.ts                 the only file the app imports
└── __tests__/
```

**Next**: [Repo tour →](./learning-path.md)
