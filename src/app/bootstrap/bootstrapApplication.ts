import { featureFlags } from '@config/featureFlags';
import {
  createApp,
  environmentSchema,
  loadFlagOverrides,
  parseFlagOverrides,
  type FrameworkApp,
  type PlatformAdapters,
} from '@framework/core';
import { namespaced } from '@framework/storage';
import type { AppEnv } from '../env';
import { appModules } from '../modules';
import { brands, isBrandId } from './brands';

/**
 * Composition root: brand + environment + flags + modules + platform adapters → app.
 *
 * Flag precedence (low → high): registry default < brand features.json < brand environment
 * overlay < remote config < persisted dev overrides < EXPO_PUBLIC_FEATURES (the last two are
 * ignored in production).
 */
export async function bootstrapApplication(
  env: AppEnv,
  adapters: PlatformAdapters,
): Promise<FrameworkApp> {
  if (!isBrandId(env.brand)) {
    throw new Error(`Unknown brand "${env.brand}". Known: ${Object.keys(brands).join(', ')}`);
  }
  const brand = brands[env.brand];
  const environment = environmentSchema.parse(env.environment);
  const allowOverrides = environment !== 'production';

  const namespace = brand.config.storage?.namespace ?? brand.config.id;
  const persisted =
    allowOverrides && adapters.keyValueStore
      ? await loadFlagOverrides(namespaced(adapters.keyValueStore, `${namespace}:`))
      : {};

  return createApp({
    brand,
    environment,
    modules: appModules,
    adapters,
    flags: {
      definitions: featureFlags,
      // Production builds ignore every local override (device and env var): flags come from the
      // registry, brand, environment overlay and remote config only.
      overrides: allowOverrides ? { ...persisted, ...parseFlagOverrides(env.features) } : {},
      allowOverrides,
    },
  });
}
