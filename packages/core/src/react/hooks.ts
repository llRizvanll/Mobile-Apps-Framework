import { useSyncExternalStore } from 'react';
import { useInject } from '@org/di/react';
import type { BrandConfig } from '../config/schema';
import type { FlagValue } from '../flags';
import { BrandConfigToken, FeatureFlagsToken } from '../tokens';

export { useInject, useOptionalInject, useResolver } from '@org/di/react';

export const useBrandConfig = (): BrandConfig => useInject(BrandConfigToken);

/** Reactive feature flag (re-renders when remote config refreshes). */
export function useFeatureFlag(key: string): boolean;
export function useFeatureFlag<T extends FlagValue>(key: string, fallback: T): T;
export function useFeatureFlag(key: string, fallback: FlagValue = false): FlagValue {
  const flags = useInject(FeatureFlagsToken);
  return useSyncExternalStore(flags.onChange, () => flags.get(key, fallback));
}
