# @org/theme

Design tokens with light/dark schemes and brand overrides.

Token layers: **base** (spacing, radii, typography, elevation, motion) → **semantic colours** per scheme
(`primary`, `onPrimary`, `surface`, …) → **component tokens** (`button.radius`, `input.height`, …).

```ts
const brand = createBrandTheme({
  colors: { light: { primary: '#C2185B' } },
  components: { button: { radius: 'pill' } },
});
const useStyles = makeStyles((t) => ({
  card: { padding: t.spacing.lg, backgroundColor: t.colors.surface },
}));
auditContrast(brand); // WCAG AA failures, used by brand contract tests
```

`ThemeProvider` follows `system | light | dark` preference (persisted in `settings`).
