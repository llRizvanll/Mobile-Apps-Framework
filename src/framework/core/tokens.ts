import { createToken } from '@framework/di';
import type { BrandTheme } from '@framework/theme';
import type { UIOverrides } from '@framework/ui';
import type { PlatformAdapters } from './adapters';
import type { BrandConfig } from './config/schema';
import type { FeatureFlags, RemoteConfigProvider } from './flags';

export const BrandConfigToken = createToken<BrandConfig>('core.BrandConfig');
export const BrandThemeToken = createToken<BrandTheme>('core.BrandTheme');
export const UIOverridesToken = createToken<UIOverrides>('core.UIOverrides');
export const FeatureFlagsToken = createToken<FeatureFlags>('core.FeatureFlags');
export const PlatformAdaptersToken = createToken<PlatformAdapters>('core.PlatformAdapters');
export const RemoteConfigToken = createToken<RemoteConfigProvider>('core.RemoteConfig');
