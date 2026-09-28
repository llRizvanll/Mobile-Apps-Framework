import { deepMerge, type DeepPartial } from '@org/foundation';
import { defaultBrandTheme } from './defaults';
import type { BrandTheme, ColorScheme, Theme } from './tokens';

export type BrandThemeOverrides = DeepPartial<BrandTheme>;

/** Builds a brand theme from the framework default plus any number of override layers. */
export const createBrandTheme = (...overrides: (BrandThemeOverrides | undefined)[]): BrandTheme =>
  deepMerge(defaultBrandTheme, ...overrides);

export function resolveTheme(brand: BrandTheme, scheme: ColorScheme): Theme {
  const { colors, ...base } = brand;
  return { ...base, scheme, isDark: scheme === 'dark', colors: colors[scheme] };
}

/** WCAG relative-luminance contrast ratio — used by brand validation and tests. */
export function contrastRatio(foreground: string, background: string): number {
  const lum = (hex: string): number => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m?.[1]) return NaN;
    const n = parseInt(m[1], 16);
    const channel = (c: number): number => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return (
      0.2126 * channel((n >> 16) & 255) +
      0.7152 * channel((n >> 8) & 255) +
      0.0722 * channel(n & 255)
    );
  };
  const [a, b] = [lum(foreground), lum(background)];
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Reports foreground/background pairs that fail WCAG AA (4.5:1) for a brand. */
export function auditContrast(brand: BrandTheme, minimum = 4.5): string[] {
  const pairs: [keyof BrandTheme['colors']['light'], keyof BrandTheme['colors']['light']][] = [
    ['onPrimary', 'primary'],
    ['onBackground', 'background'],
    ['onSurface', 'surface'],
    ['onDanger', 'danger'],
    ['onPrimaryContainer', 'primaryContainer'],
  ];
  const issues: string[] = [];
  for (const scheme of ['light', 'dark'] as const) {
    for (const [fg, bg] of pairs) {
      const ratio = contrastRatio(brand.colors[scheme][fg], brand.colors[scheme][bg]);
      if (ratio < minimum) issues.push(`${scheme}.${fg} on ${bg}: ${ratio.toFixed(2)}:1`);
    }
  }
  return issues;
}
