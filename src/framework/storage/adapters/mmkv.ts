import type { KeyValueStore } from '../kv';

/** Structural subset of `react-native-mmkv`'s MMKV instance (no hard dependency). */
export interface MMKVLike {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove?(key: string): boolean | void;
  delete?(key: string): void;
  getAllKeys(): string[];
  clearAll(): void;
}

export function createMMKVStore(mmkv: MMKVLike): KeyValueStore {
  return {
    getItem: (k) => Promise.resolve(mmkv.getString(k) ?? null),
    setItem: (k, v) => Promise.resolve(mmkv.set(k, v)),
    removeItem: (k) => {
      if (mmkv.remove) mmkv.remove(k);
      else mmkv.delete?.(k);
      return Promise.resolve();
    },
    getAllKeys: () => Promise.resolve(mmkv.getAllKeys()),
    clear: () => Promise.resolve(mmkv.clearAll()),
  };
}
