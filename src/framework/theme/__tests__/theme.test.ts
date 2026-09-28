import { auditContrast, contrastRatio, createBrandTheme, resolveTheme } from '../create';
import { defaultBrandTheme } from '../defaults';

describe('theme', () => {
  it('layers brand overrides over defaults', () => {
    const brand = createBrandTheme({
      name: 'acme',
      colors: { light: { primary: '#E91E63' } },
      components: { button: { radius: 'pill' } },
    });
    expect(brand.colors.light.primary).toBe('#E91E63');
    expect(brand.colors.light.surface).toBe(defaultBrandTheme.colors.light.surface);
    expect(brand.components.button).toEqual({
      radius: 'pill',
      height: defaultBrandTheme.components.button.height,
    });
    const dark = resolveTheme(brand, 'dark');
    expect(dark.isDark).toBe(true);
    expect(dark.colors.primary).toBe(defaultBrandTheme.colors.dark.primary);
  });

  it('computes WCAG contrast and audits the default theme as AA-compliant', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(auditContrast(defaultBrandTheme)).toEqual([]);
    const bad = createBrandTheme({ colors: { light: { primary: '#FFFF00' } } });
    expect(auditContrast(bad)).toContainEqual(
      expect.stringContaining('light.onPrimary on primary'),
    );
  });
});
