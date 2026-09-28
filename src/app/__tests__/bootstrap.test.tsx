import { FeatureFlagsToken, type PlatformAdapters } from '@framework/core';
import { MemoryKeyValueStore } from '@framework/storage';
import { cleanupTestApps } from '@framework/testing';
import { bootstrapApplication } from '../bootstrap/bootstrapApplication';
import type { AppEnv } from '../env';

// App-wiring tests use only the permanent modules (settings, devtools) so removing or adding
// product features never breaks them. Feature-specific wiring is tested in each feature.
const env = (overrides: Partial<AppEnv> = {}): AppEnv => ({
  brand: 'main',
  environment: 'development',
  apiMode: 'mock',
  features: undefined,
  ...overrides,
});
const adapters = (kv = new MemoryKeyValueStore()): PlatformAdapters => ({
  keyValueStore: kv,
  secureStore: new MemoryKeyValueStore(),
});
const ids = (app: { modules: readonly { id: string }[] }) => app.modules.map((m) => m.id);

afterEach(cleanupTestApps);

describe('bootstrapApplication (composition root)', () => {
  it('composes the modules enabled by flags', async () => {
    const app = await bootstrapApplication(env(), adapters());
    expect(ids(app)).toEqual(expect.arrayContaining(['settings', 'devtools']));
  });

  it('lets EXPO_PUBLIC_FEATURES switch a module off for one run', async () => {
    const app = await bootstrapApplication(env({ features: 'settings=off' }), adapters());
    expect(ids(app)).not.toContain('settings');
    expect(app.container.get(FeatureFlagsToken).source('settings')).toBe('override');
  });

  it('applies persisted device overrides at launch, below EXPO_PUBLIC_FEATURES', async () => {
    const persisted = new MemoryKeyValueStore({
      'main:flags.overrides': JSON.stringify({ settings: false }),
    });
    expect(ids(await bootstrapApplication(env(), adapters(persisted)))).not.toContain('settings');
    const envWins = await bootstrapApplication(
      env({ features: 'settings=on' }),
      adapters(persisted),
    );
    expect(ids(envWins)).toContain('settings');
  });

  it('locks overrides and devtools down in production', async () => {
    const persisted = new MemoryKeyValueStore({
      'main:flags.overrides': JSON.stringify({ settings: false }),
    });
    const app = await bootstrapApplication(
      env({ environment: 'production', features: 'devtools=on' }),
      adapters(persisted),
    );
    const flags = app.container.get(FeatureFlagsToken);
    expect(ids(app)).toContain('settings');
    expect(flags.isEnabled('devtools')).toBe(false);
    expect(flags.overridesAllowed).toBe(false);
  });

  it('fails fast on an unknown brand', async () => {
    await expect(bootstrapApplication(env({ brand: 'nope' }), adapters())).rejects.toThrow(
      /Unknown brand "nope"/,
    );
  });
});
