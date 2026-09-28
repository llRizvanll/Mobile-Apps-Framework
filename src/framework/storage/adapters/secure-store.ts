import type { SecureStore } from '../kv';
import type { KeyValueStore } from '../kv';

/** Structural subset of `expo-secure-store`. */
export interface ExpoSecureStoreLike {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

/**
 * expo-secure-store cannot enumerate keys, so a key index is kept in a (non-secret) side store.
 * Keys are sanitised because SecureStore only allows `[A-Za-z0-9._-]`.
 */
export function createExpoSecureStore(
  secure: ExpoSecureStoreLike,
  index: KeyValueStore,
  indexKey = '__secure_keys',
): SecureStore {
  const safe = (k: string): string => k.replace(/[^A-Za-z0-9._-]/g, '_');
  const readIndex = async (): Promise<string[]> =>
    JSON.parse((await index.getItem(indexKey)) ?? '[]') as string[];
  const writeIndex = (keys: string[]): Promise<void> =>
    index.setItem(indexKey, JSON.stringify([...new Set(keys)]));
  return {
    getItem: (k) => secure.getItemAsync(safe(k)),
    async setItem(k, v) {
      await secure.setItemAsync(safe(k), v);
      await writeIndex([...(await readIndex()), k]);
    },
    async removeItem(k) {
      await secure.deleteItemAsync(safe(k));
      await writeIndex((await readIndex()).filter((x) => x !== k));
    },
    getAllKeys: readIndex,
    async clear() {
      const keys = await readIndex();
      await Promise.all(keys.map((k) => secure.deleteItemAsync(safe(k))));
      await writeIndex([]);
    },
  };
}
