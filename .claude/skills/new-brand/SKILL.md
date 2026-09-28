---
name: new-brand
description: Create or customise a white-label brand (config, environments, feature flags, theme, copy, component overrides, store identity, EAS profiles) in this React Native app. Use when the user asks for a new brand, tenant, client app or re-skin.
---

# New brand

1. Collect: id (kebab), display name, bundle id (reverse-DNS), primary colour, locales, API base URLs per environment, enabled features.
2. Run `npm run gen:brand -- <id> --name "<Name>" --bundle <bundle.id> --color "<#hex>" --locales en,fr`.
   It creates `src/brands/<id>/{index.ts,native.json,features.json}` and registers the brand in `src/app/bootstrap/brands.ts`, the contract test and `eas.json`.
3. Edit `src/brands/<id>/index.ts`:
   - `config.api` + `environments` overlays (development/staging/production); keep `features: { devtools: false }` in production.
   - `theme`: set `colors.light` **and** `colors.dark`; keep `on*` colours readable.
   - `translations`: real `brand.tagline` for every locale; override framework copy if needed.
   - `components`: override `@framework/ui` slots by decorating `Default*` components (never the overridable export, which recurses).
4. Features: `npm run flags -- on|off <flag> --brand <id>` (edits `features.json`). If `assistant` is on, `ai.enabled` must be true.
5. `npm test`: the brand contract fails on invalid config in any environment, unregistered flags, or WCAG AA contrast failures. Fix colours rather than weakening the test.
6. Check the store identity: `EXPO_PUBLIC_BRAND=<id> npx expo config --json`. Build: `eas build --profile development-<id>`.
