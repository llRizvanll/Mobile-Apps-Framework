# Getting started

## Prerequisites

Node 20+ (22 LTS recommended), Xcode (iOS) and/or Android Studio (Android). Optional: Watchman, `eas-cli` for cloud builds.

## Run it

```bash
npm install
npm run verify            # typecheck + lint (architecture rules) + tests
cp .env.example .env
npm run ios               # or: npm run android
```

The app runs against an **in-app mock API** (`EXPO_PUBLIC_API_MODE=mock`), so no backend is needed. Tabs:
**Tasks** (reference feature), **Assistant** (AI tool calling), **Settings**, **Dev** (feature-flag panel).

## Commands

| Command                                                 | Does                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `npm start` · `npm run ios` · `npm run android`         | Metro · native build + run                                                     |
| `npm run verify`                                        | typecheck + lint + tests: the definition of done                               |
| `npm test` · `test:watch` · `test:coverage`             | Jest (`*.test.ts` in Node, `*.test.tsx` with the RN preset)                    |
| `npm run bundle:check`                                  | production Metro bundle (catches import/alias errors)                          |
| `npm run gen:feature -- <name> [--flag [--on]]`         | scaffold a feature: domain, data, presentation, AI tools, tests, tab, flag     |
| `npm run gen:brand -- <id> --name "…" --bundle com.x.y` | scaffold a brand                                                               |
| `npm run flags`                                         | list / toggle / add / remove / check feature flags ([guide](feature-flags.md)) |
| `npm run format`                                        | Prettier                                                                       |

## Make it your app (≈30 minutes)

1. **Identity**: edit `src/brands/main/native.json` (name, bundle id, scheme, version) and `package.json` `name`.
2. **Config**: set API URLs per environment in `src/brands/main/index.ts` ([configuration](configuration.md)).
3. **Pick features**: `settings` and `devtools` are permanent. `todos` (reference feature) and `assistant` (AI demo) are
   examples. Keep them as patterns until your first feature exists, then:
   ```bash
   npm run examples:remove            # dry run
   npm run examples:remove -- --yes   # removes todos, assistant, their flags and mock routes
   ```
4. **Backend**: set `EXPO_PUBLIC_API_MODE=live` and add auth ([integrations](integrations.md#authentication)). Keep `mockBackend.ts` for demos and tests, or delete it.
5. **Vendors**: wire crash reporting, analytics and storage in `src/app/bootstrap/adapters.ts`, the only file that touches native SDKs.
6. **Delivery**: `eas init`, then `eas build --profile development` ([release](configuration.md#build--release)).

## Repo tour (read in this order)

1. `src/framework/foundation/result.ts`, `errors.ts`: how failures are values
2. `src/framework/di/container.ts`: typed DI without decorators
3. `src/features/todos/`: `domain/` → `data/` → `presentation/` → `ai/` → `module.ts`: one full feature
4. `src/app/bootstrap/bootstrapApplication.ts` → `src/framework/core/kernel.ts`: how the app is composed and booted
5. `src/config/feature-flags.json` → `src/app/AppShell.tsx`: flags → modules → tabs
6. `src/features/todos/__tests__/TodoListScreen.test.tsx`: how it's all tested together

**Exercise:** `npm run gen:feature -- notes --flag --on`, open the **Notes** tab, turn it off with
`EXPO_PUBLIC_FEATURES=notes=off npm start`, and get `npm run verify` green.
