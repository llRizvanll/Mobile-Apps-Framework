import { useCallback, useRef, useSyncExternalStore } from 'react';
import { useInject } from '@framework/di/react';
import type { BrandConfig } from '../config/schema';
import type { FeatureFlags, FlagSnapshotEntry, FlagValue } from '../flags';
import type { ModuleTab } from '../module';
import { useFramework } from './FrameworkProvider';
import { BrandConfigToken, FeatureFlagsToken } from '../tokens';

export { useInject, useOptionalInject, useResolver } from '@framework/di/react';

export const useBrandConfig = (): BrandConfig => useInject(BrandConfigToken);

/** Reactive feature flag (re-renders when remote config refreshes). */
export function useFeatureFlag(key: string): boolean;
export function useFeatureFlag<T extends FlagValue>(key: string, fallback: T): T;
export function useFeatureFlag(key: string, fallback: FlagValue = false): FlagValue {
  const flags = useInject(FeatureFlagsToken);
  return useSyncExternalStore(flags.onChange, () => flags.get(key, fallback));
}

/**
 * All flags with value, source and restart status — re-renders on any change. For dev tooling.
 * Returns `[snapshot, flags]` so callers can set/clear overrides.
 */
export function useFeatureFlagsSnapshot(): readonly [readonly FlagSnapshotEntry[], FeatureFlags] {
  const flags = useInject(FeatureFlagsToken);
  const cache = useRef<{ version: number; snapshot: readonly FlagSnapshotEntry[] }>({
    version: -1,
    snapshot: [],
  });
  const version = useRef(0);
  const subscribe = useCallback(
    (listener: () => void) =>
      flags.onChange(() => {
        version.current++;
        listener();
      }),
    [flags],
  );
  const snapshot = useSyncExternalStore(subscribe, () => {
    if (cache.current.version !== version.current)
      cache.current = { version: version.current, snapshot: flags.snapshot() };
    return cache.current.snapshot;
  });
  return [snapshot, flags] as const;
}

/**
 * Tabs contributed by active modules, filtered by their `visibleWhen` runtime flags and sorted.
 * Reactive to flag changes.
 */
export function useModuleTabs(): readonly ModuleTab[] {
  const app = useFramework();
  const [snapshot] = useFeatureFlagsSnapshot();
  const enabled = new Set(snapshot.filter((f) => f.enabled).map((f) => f.key));
  return app.modules
    .flatMap((m) => m.tabs ?? [])
    .filter((t) => !t.visibleWhen || enabled.has(t.visibleWhen))
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}
