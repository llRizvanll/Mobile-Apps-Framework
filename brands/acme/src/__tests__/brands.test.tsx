import globex from '@brands/globex';
import { resolveBrandConfig, type BrandDefinition } from '@org/core';
import { auditContrast, createBrandTheme } from '@org/theme';
import acme from '../index';

// Brand contract tests: every brand must resolve in every environment and meet WCAG AA.
// The brand generator appends new brands here.
const brands: Record<string, BrandDefinition> = { acme, globex };

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
});
