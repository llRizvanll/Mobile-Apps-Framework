import { AppError, deepFreeze, deepMerge, type DeepPartial } from '@framework/foundation';
import type { TranslationTree } from '@framework/i18n';
import type { BrandThemeOverrides } from '@framework/theme';
import type { UIOverrides } from '@framework/ui';
import type { FrameworkModule } from '../module';
import {
  brandConfigSchema,
  type BrandConfig,
  type BrandConfigInput,
  type Environment,
} from './schema';

/**
 * Everything that makes a brand: validated runtime config (+ per-environment overlays), design
 * tokens, copy, component overrides and brand-only feature modules.
 */
export interface BrandDefinition {
  readonly config: Omit<BrandConfigInput, 'environment'>;
  readonly environments?: Partial<
    Record<Environment, DeepPartial<Omit<BrandConfigInput, 'environment' | 'id'>>>
  >;
  readonly theme?: BrandThemeOverrides;
  readonly translations?: Readonly<Record<string, TranslationTree>>;
  readonly components?: UIOverrides;
  readonly modules?: readonly FrameworkModule[];
}

export const defineBrand = (brand: BrandDefinition): BrandDefinition => brand;

/** Merges the environment overlay and validates. Throws `AppError('config')` listing every issue. */
export function resolveBrandConfig(brand: BrandDefinition, environment: Environment): BrandConfig {
  const merged = deepMerge<BrandConfigInput>(
    { ...brand.config, environment },
    brand.environments?.[environment],
  );
  const parsed = brandConfigSchema.safeParse(merged);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new AppError(
      'config',
      `Invalid brand config "${brand.config.id}" (${environment}):\n  - ${issues.join('\n  - ')}`,
      {
        meta: { issues },
      },
    );
  }
  return deepFreeze(parsed.data);
}
