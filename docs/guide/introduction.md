---
title: Introduction
description: What the Mobile App Framework is, who it is for, and how it helps teams ship white-label, AI-native React Native apps for iOS and Android with clean architecture and strict TypeScript.
---

# Introduction

**Mobile App Framework** is an open-source **React Native framework** (not just a boilerplate) for building
**multi-brand (white-label) iOS and Android apps** in **strict TypeScript**. It gives you the parts most
production apps rebuild from scratch, designed together and covered by tests:

- a **clean architecture** that is _enforced_ by lint rather than only documented
- **typed dependency injection**, **MVVM** view models and **MVI** stores
- **networking** for REST, GraphQL and WebSockets, with auth refresh, retries and tracing
- **Redux Toolkit** state with **persistence and migrations**
- **i18n with RTL**, **design tokens** with light/dark, and **accessible UI components**
- **observability**: logging, crash reporting, analytics and tracing
- **AI-native** building blocks: an LLM client port, tool calling and an agent loop
- **white-labelling**: validated brand configs, per-brand native identity, and contract tests

## Who it's for

| You are…                                                                | You get…                                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| An agency or product company shipping the **same app for many clients** | brand packages, one-command brand generation, per-brand builds                        |
| A team starting a **new production app**                                | a tested foundation and conventions from day one                                      |
| A platform team maintaining **several apps**                            | shared `@org/*` packages behind stable ports; upgrades are version bumps              |
| A team adopting **AI coding agents**                                    | `AGENTS.md`, skills, generators, and lint that keeps agents inside the architecture   |
| A team building **in-app AI features**                                  | tools on top of your use cases, a safe agent loop, and a vendor-neutral backend proxy |

## Principles

1. **Ports & adapters**: the framework never imports a native SDK. Apps plug in MMKV or AsyncStorage, Sentry, Segment, and so on, in one file.
2. **Errors are values**: data APIs return `Result<T, AppError>` with codes, retryability and i18n keys.
3. **Composition over configuration**: features are modules with DI bindings, reducers, translations, AI tools and lifecycle hooks.
4. **Everything testable in Node**: the whole kernel boots in Jest with in-memory adapters.
5. **Rules the tooling enforces**: architecture, strict types and brand accessibility all fail CI when they are broken.

## Tech stack

React Native 0.86 · Expo SDK 57 · React 19.2 · TypeScript 6 (strict, `exactOptionalPropertyTypes`) ·
Redux Toolkit 2 · zod 4 · Jest 30 · React Native Testing Library 14 · ESLint 10 · VitePress.

**Next**: [Quick start →](./getting-started.md)
