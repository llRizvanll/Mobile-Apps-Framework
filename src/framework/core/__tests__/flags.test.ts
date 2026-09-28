import { MemoryKeyValueStore } from '@framework/storage';
import {
  FLAG_OVERRIDES_KEY,
  createFeatureFlags,
  loadFlagOverrides,
  parseFlagOverrides,
  parseFlagRegistry,
} from '../flags';

const registry = parseFlagRegistry({
  todos: { default: true, description: 'Tasks', kind: 'module' },
  assistant: { default: false, description: 'AI assistant', kind: 'module', requires: ['todos'] },
  'todos.maxItems': { default: 50, description: 'Limit' },
  'checkout.variant': { default: 'a', description: 'Experiment arm' },
});

describe('feature flags', () => {
  it('layers default < brand < remote < override and reports the source', async () => {
    const flags = createFeatureFlags({
      definitions: registry,
      brand: { assistant: true },
      remote: { fetch: () => Promise.resolve({ 'todos.maxItems': 20 }) },
      overrides: { 'checkout.variant': 'b' },
    });
    await flags.refresh();
    expect(flags.isEnabled('assistant')).toBe(true);
    expect(flags.source('assistant')).toBe('brand');
    expect(flags.get('todos.maxItems', 0)).toBe(20);
    expect(flags.source('todos.maxItems')).toBe('remote');
    expect(flags.get('checkout.variant', 'a')).toBe('b');
    expect(flags.source('checkout.variant')).toBe('override');
    expect(flags.source('nope')).toBe('unknown');
    expect(flags.get('nope', true)).toBe(true);
  });

  it('enforces `requires` dependencies', () => {
    const flags = createFeatureFlags({
      definitions: registry,
      brand: { todos: false, assistant: true },
    });
    expect(flags.isEnabled('assistant')).toBe(false);
  });

  it('persists overrides, flags module changes as restart-required, and can clear them', async () => {
    const store = new MemoryKeyValueStore();
    const flags = createFeatureFlags({ definitions: registry, overrideStore: store });
    const onChange = jest.fn();
    flags.onChange(onChange);
    await flags.setOverride('assistant', true);
    expect(flags.isEnabled('assistant')).toBe(true);
    expect(flags.pendingRestart()).toEqual(['assistant']);
    expect(flags.snapshot().find((f) => f.key === 'assistant')).toMatchObject({
      source: 'override',
      restartRequired: true,
    });
    expect(await loadFlagOverrides(store)).toEqual({ assistant: true });
    await flags.clearOverrides();
    expect(flags.pendingRestart()).toEqual([]);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(await store.getItem(FLAG_OVERRIDES_KEY)).toBe('{}');
  });

  it('refuses overrides when disabled (production)', async () => {
    const flags = createFeatureFlags({ definitions: registry, allowOverrides: false });
    await expect(flags.setOverride('assistant', true)).rejects.toThrow(/disabled/);
  });

  it('parses env-style override specs', () => {
    expect(
      parseFlagOverrides('assistant=off, todos=on,todos.maxItems=10,checkout.variant=b,beta'),
    ).toEqual({
      assistant: false,
      todos: true,
      'todos.maxItems': 10,
      'checkout.variant': 'b',
      beta: true,
    });
    expect(parseFlagOverrides(undefined)).toEqual({});
  });

  it('validates registries', () => {
    expect(() => parseFlagRegistry({ Bad_Key: { default: true, description: 'x' } })).toThrow(
      /Invalid feature flag registry/,
    );
    expect(() =>
      parseFlagRegistry({ a: { default: true, description: 'x', requires: ['ghost'] } }),
    ).toThrow(/unknown flag "ghost"/);
  });
});
