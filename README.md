# Mobile App Framework

A white-label, **AI-native** React Native framework in strict TypeScript. Build one app and ship it as many brands,
or use the packages to start new apps with architecture, observability and AI already in place.

- **Architecture**: hexagonal packages (ports & adapters), clean-architecture feature modules, MVVM _and_ MVI, typed DI
- **Data**: REST (middleware pipeline, auth refresh, retries), GraphQL (+ subscriptions), resilient WebSocket, `Result`-based errors
- **State & storage**: Redux Toolkit with typed registry and versioned persistence; KV / secure / SQLite ports
- **Experience**: design tokens + light/dark, atomic UI with brand overrides, i18n with plurals + RTL, accessibility built-in
- **Operations**: structured logs with PII redaction, crash reporting, consent-aware analytics, tracing with `traceparent`
- **AI-native**: vendor-neutral AI client, features expose tools to an agent loop, plus `AGENTS.md`, skills and generators for coding agents
- **White-label**: validated brand configs with environment overlays, WCAG contrast contract tests, one-command brand generation

## Quick start

```bash
npm install
npm run verify                       # typecheck + lint (incl. architecture rules) + tests
cd apps/example
EXPO_PUBLIC_BRAND=acme npx expo run:ios      # or globex; runs against an in-app mock API by default
```

## Repository layout

```
packages/        @org/* framework (foundation, di, observability, storage, network, state,
                 i18n, theme, presentation, ui, ai, core, testing)
brands/          brand packages: config + theme + copy + component overrides + native.json
apps/example/    reference Expo app: composition root, todos (MVVM) and assistant (MVI + AI tools)
scripts/         gen:feature, gen:brand generators
docs/            architecture, features, brands, ADRs
AGENTS.md        rules & commands for AI coding agents (CLAUDE.md imports it)
```

## Docs

- [Architecture](docs/architecture.md) — layer graph, boot sequence, HTTP pipeline, patterns
- [Building features](docs/features.md) · [Brands](docs/brands.md) · [ADRs](docs/adr/README.md)
- Each package has a README with its public API and extension points.

## Scripts

| Command                                                 | Does                                 |
| ------------------------------------------------------- | ------------------------------------ |
| `npm run verify`                                        | typecheck + lint + all tests         |
| `npm run gen:feature -- <name> [--flag]`                | scaffold + register a feature module |
| `npm run gen:brand -- <id> --name "…" --bundle com.x.y` | scaffold + register a brand          |
| `npm run format`                                        | prettier                             |
