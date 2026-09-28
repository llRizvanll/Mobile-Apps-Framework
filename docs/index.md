---
layout: home
title: White-label, AI-native React Native framework
description: Open-source React Native framework and boilerplate in strict TypeScript for multi-brand iOS and Android apps — clean architecture, MVVM & MVI, dependency injection, Redux Toolkit, REST/GraphQL/WebSocket, i18n & RTL, design tokens, observability and AI tool calling.

hero:
  name: Mobile App Framework
  text: One React Native codebase. Many brands. AI-native.
  tagline: A strict-TypeScript framework with clean architecture, typed dependency injection, MVVM & MVI, resilient networking, white-labelling and LLM tool calling, all tested and lint-enforced.
  image:
    src: /logo.svg
    alt: Mobile App Framework logo
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: See the workflows
      link: /workflows/
    - theme: alt
      text: GitHub
      link: https://github.com/llRizvanll/Mobile-Apps-Framework

features:
  - icon: 🏛️
    title: Clean architecture, enforced
    details: Hexagonal packages and domain/data/presentation features. Layer boundaries come from package.json and are checked by ESLint on every PR.
  - icon: 🎨
    title: White-label by design
    details: zod-validated brand configs with per-environment overlays, design tokens, copy and component overrides, and WCAG contrast contract tests. One command creates a new brand.
  - icon: 🤖
    title: AI-native
    details: A vendor-neutral LLM client, features that expose typed tools, and an agent loop with human confirmation. AGENTS.md, skills and generators support AI coding agents.
  - icon: 🔌
    title: REST · GraphQL · WebSocket
    details: A Result-based HTTP pipeline with single-flight token refresh, retries and tracing, plus graphql-ws subscriptions over a WebSocket that reconnects on its own.
  - icon: 🧩
    title: MVVM + MVI + typed DI
    details: React-free view models and MVI stores that can be unit-tested, and a decorator-free DI container with scopes, multi-bindings and cycle detection.
  - icon: 🌍
    title: i18n, RTL & accessibility
    details: Plurals via Intl, lazy locales, compile-time checked translation keys, automatic RTL layout, and accessible atomic components.
  - icon: 💾
    title: State & persistence
    details: Redux Toolkit with a typed registry, versioned persistence with migrations, and secure storage and SQLite behind ports.
  - icon: 📈
    title: Observability built-in
    details: Structured logs with PII redaction, crash reporting, consent-aware analytics, and W3C traceparent tracing from app to backend.
---
