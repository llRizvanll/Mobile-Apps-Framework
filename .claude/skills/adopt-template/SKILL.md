---
name: adopt-template
description: Turn this React Native starter into a new product app — rename, create the primary brand, choose/remove example features and flags, connect the backend, wire vendors and set up delivery. Use when the user starts a new app from this repository.
---

# Adopt the template

Reference: `docs/getting-started.md` (Make it your app). Confirm the product name, bundle id, colour, locales and which example features to keep before editing.

1. Brand: `npm run gen:brand -- <id> --name "<Name>" --bundle <bundle.id> --color "<#hex>" --locales <list>`; set `EXPO_PUBLIC_BRAND=<id>` in `.env.example`; remove unneeded brands from `src/brands/`, `src/app/bootstrap/brands.ts`, `src/brands/__tests__/brands.test.tsx` and `eas.json`.
2. `package.json`: `name`, `description`, `homepage`, `repository`.
3. Example features: `npm run examples:remove` (dry run) then `-- --yes`. It removes todos + assistant, their flags and mock routes, and keeps settings/devtools.
4. Backend and vendors: follow the `integrations` skill.
5. Docs: update the README title and positioning. Keep the architecture docs (they still apply) or delete `docs/`.
6. `npm run verify && npm run flags -- doctor && npm run bundle:check`, then `npm run ios`.
