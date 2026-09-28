import { parseFlagRegistry, useFeatureFlag, type FlagValue } from '@framework/core';
import registry from './feature-flags.json';

/**
 * The app's feature-flag registry — the single list of every flag, its default, kind and owner.
 * Edit `feature-flags.json` directly or with `npm run flags -- add|on|off|set|remove`.
 * Validated at startup (bad keys, unknown `requires` → config error).
 */
export const featureFlags = parseFlagRegistry(registry);

/** Every flag key, checked at compile time. */
export type FeatureFlagKey = keyof typeof registry;

/** Typed boolean flag hook: `const showCompleted = useFlag('todos.showCompleted')`. Re-renders on change. */
export const useFlag = (key: FeatureFlagKey): boolean => useFeatureFlag(key);

/** Typed non-boolean flag hook: `useFlagValue('checkout.variant', 'a')`. */
export const useFlagValue = <T extends FlagValue>(key: FeatureFlagKey, fallback: T): T =>
  useFeatureFlag(key, fallback);

/** Typed key helper for module declarations: `featureFlag: flag('todos')`. */
export const flag = (key: FeatureFlagKey): FeatureFlagKey => key;
