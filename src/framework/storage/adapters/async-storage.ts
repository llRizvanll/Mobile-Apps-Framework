import type { KeyValueStore } from '../kv';

/** Structural subset of `@react-native-async-storage/async-storage`. */
export interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  clear(): Promise<void>;
}

export const createAsyncStorageStore = (storage: AsyncStorageLike): KeyValueStore => ({
  getItem: (k) => storage.getItem(k),
  setItem: (k, v) => storage.setItem(k, v),
  removeItem: (k) => storage.removeItem(k),
  getAllKeys: () => storage.getAllKeys(),
  clear: () => storage.clear(),
});
