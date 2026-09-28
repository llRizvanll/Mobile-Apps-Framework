import { createApp, environmentSchema, type FrameworkApp, type PlatformAdapters } from '@org/core';
import { assistantModule } from '../features/assistant/module';
import { todosModule } from '../features/todos/module';
import { brands, isBrandId } from './brands';

/** Feature modules shipped in this app. Brand flags decide which are active. */
export const appModules = [todosModule, assistantModule];

export interface ApplicationEnv {
  readonly brand?: string | undefined;
  readonly environment?: string | undefined;
}

/** Composition root: brand + environment + modules + platform adapters → app. */
export function createApplication(env: ApplicationEnv, adapters: PlatformAdapters): FrameworkApp {
  const brandId = env.brand ?? 'acme';
  if (!isBrandId(brandId))
    throw new Error(`Unknown brand "${brandId}". Known: ${Object.keys(brands).join(', ')}`);
  return createApp({
    brand: brands[brandId],
    environment: environmentSchema.parse(env.environment ?? 'development'),
    modules: appModules,
    adapters,
  });
}
