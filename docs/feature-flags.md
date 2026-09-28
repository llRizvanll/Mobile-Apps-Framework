# Feature flags

Every feature can be switched on or off without code changes: per run, per device, per brand, per environment, or remotely.

## Turning things on and off

| I want to…                          | Do this                                                 | Applies                |
| ----------------------------------- | ------------------------------------------------------- | ---------------------- |
| Try the app without a feature, once | `EXPO_PUBLIC_FEATURES=assistant=off npm start`          | next launch            |
| Toggle on my device                 | **Dev** tab → switch (→ _Restart now_ for module flags) | instantly / on restart |
| Change the default                  | `npm run flags -- off assistant`                        | next build             |
| Change it for one brand             | `npm run flags -- off assistant --brand main`           | next build             |
| Change it in production only        | brand `environments.production.features`                | next build             |
| Flip it in the field                | a remote config provider (see below)                    | next fetch / launch    |
| See everything                      | `npm run flags`                                         | —                      |

## Two kinds

|           | `module`                                                        | `runtime`                                                          |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| Gates     | a whole feature: DI, state, translations, AI tools, **its tab** | behaviour inside screens                                           |
| Evaluated | once at boot                                                    | live (`useFlag`)                                                   |
| Examples  | `todos`, `assistant`, `settings`                                | `todos.showCompleted`, `devtools`, limits, variants, kill switches |

## Registry: `src/config/feature-flags.json`

```json
"assistant": {
  "default": false,
  "kind": "module",
  "description": "AI assistant tab. Requires ai.enabled in the brand config.",
  "owner": "ai-team",
  "requires": ["todos"],
  "expires": "2027-06-30"
}
```

`default` is boolean, number or string (the type is enforced everywhere). `requires` lists flags that must also be on.
`expires` makes `doctor` warn so stale flags get removed. Keys are compile-time checked in code.

## Precedence (highest wins)

```mermaid
flowchart LR
  D[registry default] --> B[brand features.json] --> E[brand environment overlay] --> R[remote config] --> O[device override] --> V[EXPO_PUBLIC_FEATURES]
```

`requires` is applied last. Device overrides and `EXPO_PUBLIC_FEATURES` are **ignored in production**, and the `devtools`
tab is off there. Tests enforce both. The Dev tab shows where each value came from.

## In code

```ts
// gate a whole feature (module.ts)
featureFlag: flag('orders'),
tabs: [{ key: 'orders', titleKey: 'orders.tab', component: OrdersScreen }],

// behaviour inside a screen
const showCompleted = useFlag('todos.showCompleted');
const limit = useFlagValue('orders.pageSize', 20);

// show/hide a tab live
tabs: [{ key: 'devtools', …, visibleWhen: 'devtools' }],

// outside React
resolver.get(FeatureFlagsToken).isEnabled('assistant');
```

## CLI

```bash
npm run flags                                          # table: default + value per brand
npm run flags -- on|off <flag> [--brand <id|all>]
npm run flags -- set orders.pageSize 50 [--brand main]
npm run flags -- unset <flag> --brand main
npm run flags -- add orders --kind module --description "Orders" --owner shop-team [--default on] [--requires todos] [--expires 2027-01-31]
npm run flags -- remove orders                         # also lists remaining code references
npm run flags -- doctor                                # validation (runs in CI)
```

`doctor` fails on unknown or mistyped brand values, broken `requires`, and flags used in code but not registered.
It warns on expired or unused flags.

## Remote config

```ts
// src/app/bootstrap/adapters.ts
remoteConfig: {
  async fetch() {
    await sdk.fetchAndActivate();
    return sdk.getAll();          // Record<string, boolean | number | string>
  },
},
```

Runtime flags update live. Module flags pick up remote values at the next launch if your SDK caches the last fetch.

## Lifecycle

Add it (off, with owner + expiry) → on for staging (environment overlay) → on in production → make it the default →
`npm run flags -- remove <flag>` and delete the dead branch. Long-lived flags are debt.
