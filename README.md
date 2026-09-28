# React Native Boilerplate: TypeScript + Expo with a Built-in Framework

**Clone it, build your features, ship.** A lean, production-ready React Native app where the hard parts (architecture,
networking, state, feature flags, theming, i18n, observability, white-labelling and AI) are already integrated,
tested and documented.

[![CI](https://github.com/llRizvanll/Mobile-Apps-Framework/actions/workflows/ci.yml/badge.svg)](https://github.com/llRizvanll/Mobile-Apps-Framework/actions/workflows/ci.yml)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)
![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)

## Quick start

```bash
git clone https://github.com/llRizvanll/Mobile-Apps-Framework.git my-app && cd my-app
npm install
npm run verify              # typecheck + lint + tests
cp .env.example .env
npm run ios                 # or npm run android. Runs against a built-in mock API
```

Then make it yours ([guide](docs/getting-started.md#make-it-your-app-30-minutes)). When you're ready for a clean slate,
`npm run examples:remove -- --yes` strips the demo features, their flags and mock routes.

## What's included

|                     |                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Architecture**    | Clean-architecture features (domain / data / presentation), MVVM + MVI, typed DI, lint-enforced layer boundaries    |
| **Feature flags**   | Typed registry, per-brand/environment values, remote config, env-var and on-device overrides, Dev panel, CLI        |
| **Networking**      | REST with `Result` errors, retries and single-flight token refresh · GraphQL + subscriptions · WebSocket · mock API |
| **State & storage** | Redux Toolkit with versioned persistence · secure storage · key-value · SQLite port                                 |
| **UI**              | Design tokens, light/dark, accessible atomic components, i18n with plurals and RTL                                  |
| **Operations**      | Structured logs (PII-redacted), crash reporting, consent-aware analytics, tracing                                   |
| **AI**              | In-app assistant calling your use cases as tools, plus `AGENTS.md`, skills and generators for coding agents         |
| **Delivery**        | Jest + RNTL harness, CI, EAS build profiles, white-label brands                                                     |

Everything vendor-specific sits behind a port, and the defaults are wired in one file (`src/app/bootstrap/adapters.ts`).

## Build a feature

```bash
npm run gen:feature -- orders --flag --on
```

This creates `src/features/orders/` (domain, data, view model, screen, AI tools, tests), registers the module, adds its tab and a feature flag. → [Building features](docs/features.md)

## Turn features on and off

```bash
EXPO_PUBLIC_FEATURES=assistant=off npm start     # this run only
npm run flags -- off assistant                   # default for the app
npm run flags                                    # see all flags
```

The in-app **Dev** tab toggles flags on device and shows where each value comes from. → [Feature flags](docs/feature-flags.md)

## Project layout

```text
src/app/          App shell, composition root, platform adapters, mock API
src/features/     your product (todos = reference feature, assistant, settings, devtools)
src/brands/main/  app identity, config, theme, copy, feature values
src/config/       feature-flag registry
src/framework/    the built-in framework: foundation · di · observability · storage · network · state
                  i18n · theme · presentation · ui · ai · core · testing
```

## Scripts

| Script                              |                                                   |
| ----------------------------------- | ------------------------------------------------- |
| `npm start` · `ios` · `android`     | run                                               |
| `npm run verify`                    | typecheck + lint + tests                          |
| `npm run bundle:check`              | production bundle check                           |
| `npm run gen:feature` · `gen:brand` | scaffold a feature / brand                        |
| `npm run flags`                     | feature-flag CLI                                  |
| `npm run examples:remove`           | remove the demo features (dry run unless `--yes`) |

## Docs

[Getting started](docs/getting-started.md) · [Architecture](docs/architecture.md) · [Features](docs/features.md) ·
[Feature flags](docs/feature-flags.md) · [Configuration, build & release](docs/configuration.md) · [Brands](docs/brands.md) ·
[Integrations](docs/integrations.md) · [AI](docs/ai.md) · [Decisions](docs/decisions.md) · [Troubleshooting](docs/troubleshooting.md)

AI coding agents: start with [`AGENTS.md`](AGENTS.md).
