import {
  MemoryKeyValueStore,
  createExpoSecureStore,
  createMMKVStore,
  namespaced,
  typedEntry,
  type ExpoSecureStoreLike,
} from '../index';

describe('namespaced', () => {
  it('isolates keys under a prefix', async () => {
    const base = new MemoryKeyValueStore({ other: '1' });
    const ns = namespaced(base, 'acme:');
    await ns.setItem('a', 'x');
    expect(await ns.getAllKeys()).toEqual(['a']);
    await ns.clear();
    expect(base.snapshot()).toEqual({ other: '1' });
  });
});

describe('typedEntry', () => {
  it('round-trips JSON, validates, and expires by TTL', async () => {
    let now = 1000;
    const store = new MemoryKeyValueStore();
    const entry = typedEntry<{ n: number }>(store, 'k', {
      ttlMs: 50,
      now: () => now,
      parser: {
        parse: (x) => {
          if (typeof (x as { n?: unknown }).n !== 'number') throw new Error('bad');
          return x as { n: number };
        },
      },
    });
    await entry.set({ n: 1 });
    expect(await entry.get()).toEqual({ n: 1 });
    now += 100;
    expect(await entry.get()).toBeUndefined();
    await store.setItem('k', '{"v":{"n":"nope"}}');
    expect(await entry.get()).toBeUndefined();
  });
});

describe('adapters', () => {
  it('wraps an MMKV-like instance', async () => {
    const map = new Map<string, string>();
    const kv = createMMKVStore({
      getString: (k) => map.get(k),
      set: (k, v) => void map.set(k, v),
      remove: (k) => map.delete(k),
      getAllKeys: () => [...map.keys()],
      clearAll: () => map.clear(),
    });
    await kv.setItem('a', '1');
    expect(await kv.getItem('a')).toBe('1');
    await kv.removeItem('a');
    expect(await kv.getItem('a')).toBeNull();
  });

  it('indexes expo-secure-store keys and sanitises them', async () => {
    const secrets = new Map<string, string>();
    const expo: ExpoSecureStoreLike = {
      getItemAsync: (k) => Promise.resolve(secrets.get(k) ?? null),
      setItemAsync: (k, v) => Promise.resolve(void secrets.set(k, v)),
      deleteItemAsync: (k) => Promise.resolve(void secrets.delete(k)),
    };
    const store = createExpoSecureStore(expo, new MemoryKeyValueStore());
    await store.setItem('auth:token', 't');
    expect([...secrets.keys()]).toEqual(['auth_token']);
    expect(await store.getAllKeys()).toEqual(['auth:token']);
    await store.clear();
    expect(secrets.size).toBe(0);
  });
});
