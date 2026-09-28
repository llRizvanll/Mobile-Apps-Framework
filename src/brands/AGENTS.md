# src/brands — rules for white-label brands

Create brands with `npm run gen:brand`. A brand = `index.ts(x)` (`defineBrand`) + `native.json` (store identity) + `features.json` (flag values).

- Brands contain data and presentation overrides only; they must not import `@app/*` or `@features/*`.
- Feature values: `npm run flags -- on|off <flag> --brand <id>`; environment-specific values in `environments.<env>.features`. Keep `devtools: false` in production.
- Theme: set light **and** dark colours; the contract test enforces WCAG AA.
- Components: override `@framework/ui` slots by decorating `Default*` components.
- Every supported locale needs `brand.tagline` (contract test).
- Registering/removing a brand touches: `src/app/bootstrap/brands.ts`, `__tests__/brands.test.tsx`, `eas.json` (the generator handles adding).
