---
title: Quick start
description: Install and run the React Native framework in minutes — clone the monorepo, run the verification suite, launch the example Expo app for a brand, and create your first feature and brand.
---

# Quick start

## Prerequisites

- Node.js **20+** (22 LTS recommended) and npm 10+
- Xcode (iOS) and/or Android Studio (Android) for native builds
- Optional: [Watchman](https://facebook.github.io/watchman/) for faster Metro

## 1. Install and verify

```bash
git clone https://github.com/llRizvanll/Mobile-Apps-Framework.git
cd Mobile-Apps-Framework
npm install
npm run verify        # typecheck + lint (architecture rules) + tests
```

## 2. Run the example app

```bash
cd apps/example
EXPO_PUBLIC_BRAND=acme npx expo run:ios       # or run:android
EXPO_PUBLIC_BRAND=globex npx expo run:ios     # same code, different brand
```

By default the app uses an **in-app mock API** (`EXPO_PUBLIC_API_MODE=mock`), so it runs without a backend. Try the **assistant** tab in Acme and ask _"what are my tasks?"_ or _"add buy milk"_.

| Variable               | Values                                   | Default       |
| ---------------------- | ---------------------------------------- | ------------- |
| `EXPO_PUBLIC_BRAND`    | any id in `brands/`                      | `acme`        |
| `EXPO_PUBLIC_ENV`      | `development` · `staging` · `production` | `development` |
| `EXPO_PUBLIC_API_MODE` | `mock` · `live`                          | `mock`        |

## 3. Create a feature

```bash
npm run gen:feature -- orders --flag
```

This creates `apps/example/src/features/orders/` (domain, data, presentation, ai, tests) and registers the module. Follow the [feature workflow](../workflows/feature-development.md).

## 4. Create a brand

```bash
npm run gen:brand -- initech --name "Initech Ops" --bundle com.initech.ops --color "#6A1B9A" --locales en,fr
npm install && npm test
```

## 5. Explore the docs locally

```bash
npm run docs:dev
```

**Next**: [Project structure →](./project-structure.md)
