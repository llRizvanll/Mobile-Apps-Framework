import registry from '@config/feature-flags.json';
import { resolveBrandConfig, type BrandDefinition } from '@framework/core';
import { auditContrast, createBrandTheme } from '@framework/theme';
import main from '@brands/main';

// Brand contract tests: every brand must resolve in every environment and meet WCAG AA.
// The brand generator appends new brands here.
const brands: Record<string, BrandDefinition> = { main };

describe.each(Object.entries(brands))('brand %s', (_name, brand) => {
  it.each(['development', 'staging', 'production'] as const)(
    'resolves a valid %s config',
    (env) => {
      expect(() => resolveBrandConfig(brand, env)).not.toThrow();
    },
  );

  it('meets WCAG AA contrast in light and dark', () => {
    expect(auditContrast(createBrandTheme(brand.theme))).toEqual([]);
  });

  it('translates brand copy for every supported locale', () => {
    const { supportedLocales } = resolveBrandConfig(brand, 'development').i18n;
    for (const locale of supportedLocales)
      expect(brand.translations?.[locale]).toHaveProperty('brand.tagline');
  });

  it.each(['development', 'staging', 'production'] as const)(
    'only sets registered feature flags (%s)',
    (env) => {
      const unknown = Object.keys(resolveBrandConfig(brand, env).features).filter(
        (k) => !(k in registry),
      );
      expect(unknown).toEqual([]);
    },
  );

  it('turns devtools off in production', () => {
    expect(resolveBrandConfig(brand, 'production').features['devtools']).toBe(false);
  });
});
