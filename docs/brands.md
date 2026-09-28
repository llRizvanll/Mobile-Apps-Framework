# Brands (white-label)

One codebase → many store apps. A brand is a small workspace package in `brands/<id>/`:

| File              | Purpose                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/native.json` | Store identity (name, bundle id, scheme, version, colour). Read by **both** `app.config.ts` (native build) and the brand config (runtime) — single source of truth. |
| `src/index.ts(x)` | `defineBrand({ config, environments, theme, translations, components, modules })`                                                                                   |

## What a brand can change

- **Config** (validated by zod, per-environment overlays): API endpoints, headers, locales, feature flags, logging, consent policy, AI settings, `extra`.
- **Theme**: any subset of tokens — colours per scheme, radii, typography, fonts, component tokens.
- **Copy**: override any translation key, including framework keys (`framework.error.*`).
- **Components**: replace any `@org/ui` slot (`Button`, `Screen`, …). Decorate via `Default*` exports.
- **Modules**: brand-only features.

## Create / build

```bash
npm run gen:brand -- initech --name "Initech Ops" --bundle com.initech.ops --color "#6A1B9A" --locales en,fr
npm install
npm test                                    # brand contract: valid in all envs + WCAG AA
cd apps/example && EXPO_PUBLIC_BRAND=initech npx expo run:ios
```

## Separate brand repositories

Brands don't have to live here. Publish `@org/*` to your registry, and a brand repo becomes:
`package.json` (deps on `@org/*`), `brand/` (this same `defineBrand` package), `src/features/*`, and a
composition root identical to `apps/example/src/bootstrap/`. Framework upgrades are version bumps.
