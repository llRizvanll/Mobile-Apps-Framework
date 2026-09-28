# Brands (white-label)

The app always runs as a **brand**. A single-brand app just edits `src/brands/main/`. To ship the same code as
several store apps, add more brands.

| File            | Holds                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `native.json`   | store identity: name, bundle id, scheme, version, colour (read by `app.config.ts` and the runtime config) |
| `features.json` | this brand's flag values                                                                                  |
| `index.ts`      | `defineBrand({ config, environments, theme, translations, components, modules })`                         |

A brand can change API endpoints and config per environment, its feature set, any design tokens (light **and**
dark), any copy (including framework strings), and any `@framework/ui` component:

```tsx
function BrandButton(props: ButtonProps) {
  return <DefaultButton {...props} size={props.size ?? 'lg'} />;   // decorate Default*, keep a11y
}
defineBrand({ …, components: { Button: BrandButton } });
```

## Add a brand

```bash
npm run gen:brand -- acme --name "Acme Tasks" --bundle com.acme.tasks --color "#C2185B" --locales en,ar
npm run flags -- on assistant --brand acme
npm test                                         # brand contract tests
EXPO_PUBLIC_BRAND=acme npm run ios
eas build --profile production-acme --platform all
```

The generator registers the brand in `src/app/bootstrap/brands.ts`, the contract test and `eas.json`.

## Contract tests (`src/brands/__tests__/brands.test.tsx`)

For every brand: config is valid in all environments, light and dark themes pass **WCAG AA**, every locale has brand
copy, only registered flags are set, and `devtools` is off in production.

To remove a brand, delete its folder and its entries in `brands.ts`, the contract test and `eas.json`.
