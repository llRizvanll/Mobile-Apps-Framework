---
name: new-brand
description: Create or customise a white-label brand (config, theme, copy, component overrides, store identity) for this React Native framework. Use when the user asks for a new brand, tenant, client app, or re-skin.
---

# New brand

1. Collect: id (kebab), display name, bundle id (reverse-DNS), primary colour, locales, API base URLs per environment, enabled features.
2. Run `npm run gen:brand -- <id> --name "<Name>" --bundle <bundle.id> --color "<#hex>" --locales en,fr` then `npm install`.
3. Edit `brands/<id>/src/index.ts`:
   - `config.api` + `environments` overlays (dev/staging/production).
   - `theme`: set `colors.light` and `colors.dark` together; keep `on*` colours readable.
   - `translations`: real `brand.tagline` per locale; override framework copy if needed.
   - `components`: override `@org/ui` slots by decorating `Default*` components (never the overridable export — it recurses).
4. Run `npm test` — the brand contract test fails on invalid config in any environment or WCAG AA contrast failures. Fix colours rather than weakening the test.
5. Verify the store identity: `cd apps/example && EXPO_PUBLIC_BRAND=<id> npx expo config --json`.
