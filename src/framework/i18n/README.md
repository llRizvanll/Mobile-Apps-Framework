# @framework/i18n

Dependency-free i18n: interpolation, plurals, fallbacks, lazy locales, RTL.

```ts
const { t, locale, direction } = useTranslation<typeof en>(); // keys checked at compile time
t('todos.remaining', { count: 3 }); // Intl.PluralRules: zero/one/few/many/other
i18n.formatCurrency(9.99, 'EUR');
```

- Fallback chain: `en-GB → en → fallbackLocale`. `loaders` lazy-load locales on `setLocale`.
- `matchLocale(deviceLocales, supported, default)`; `syncLayoutDirection(adapter, locale)` for RTL.
- Resources are merged: framework → modules → brand (brand wins).
