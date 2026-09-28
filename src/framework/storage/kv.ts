import { AppError, type Parser } from '@framework/foundation';

/**
 * Key-value storage port. Async so it fits every backend (MMKV, AsyncStorage, SecureStore,
 * IndexedDB on web). Sync backends are simply wrapped.
 */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  clear(): Promise<void>;
}

/** Secure storage (Keychain / Keystore). Same shape; separate token so it can't be mixed up. */
export type SecureStore = KeyValueStore;

export class MemoryKeyValueStore implements KeyValueStore {
  private readonly data = new Map<string, string>();
  constructor(initial?: Record<string, string>) {
    if (initial) for (const [k, v] of Object.entries(initial)) this.data.set(k, v);
  }
  getItem(key: string): Promise<string | null> {
    return Promise.resolve(this.data.get(key) ?? null);
  }
  setItem(key: string, value: string): Promise<void> {
    this.data.set(key, value);
    return Promise.resolve();
  }
  removeItem(key: string): Promise<void> {
    this.data.delete(key);
    return Promise.resolve();
  }
  getAllKeys(): Promise<readonly string[]> {
    return Promise.resolve([...this.data.keys()]);
  }
  clear(): Promise<void> {
    this.data.clear();
    return Promise.resolve();
  }
  snapshot(): Record<string, string> {
    return Object.fromEntries(this.data);
  }
}

/** Isolates a store under a prefix, e.g. per brand or per user: `namespaced(store, 'acme:')`. */
export function namespaced(store: KeyValueStore, prefix: string): KeyValueStore {
  return {
    getItem: (k) => store.getItem(prefix + k),
    setItem: (k, v) => store.setItem(prefix + k, v),
    removeItem: (k) => store.removeItem(prefix + k),
    getAllKeys: async () =>
      (await store.getAllKeys())
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length)),
    clear: async () => {
      const keys = (await store.getAllKeys()).filter((k) => k.startsWith(prefix));
      await Promise.all(keys.map((k) => store.removeItem(k)));
    },
  };
}

interface Envelope<T> {
  readonly v: T;
  /** Absolute expiry epoch ms. */
  readonly e?: number;
}

export interface TypedEntryOptions<T> {
  /** Validate on read — corrupt/legacy data returns the default instead of crashing. */
  readonly parser?: Parser<T>;
  readonly ttlMs?: number;
  readonly now?: () => number;
}

/**
 * Strongly-typed JSON entry with optional schema validation and TTL.
 *   const onboarding = typedEntry<boolean>(store, 'onboarding.done');
 */
export function typedEntry<T>(
  store: KeyValueStore,
  key: string,
  options: TypedEntryOptions<T> = {},
) {
  const now = options.now ?? Date.now;
  return {
    key,
    async get(): Promise<T | undefined> {
      const raw = await store.getItem(key);
      if (raw === null) return undefined;
      try {
        const env = JSON.parse(raw) as Envelope<unknown>;
        if (env.e !== undefined && env.e <= now()) {
          await store.removeItem(key);
          return undefined;
        }
        return options.parser ? options.parser.parse(env.v) : (env.v as T);
      } catch {
        return undefined;
      }
    },
    async set(value: T): Promise<void> {
      const env: Envelope<T> = options.ttlMs
        ? { v: value, e: now() + options.ttlMs }
        : { v: value };
      try {
        await store.setItem(key, JSON.stringify(env));
      } catch (cause) {
        throw new AppError('storage', `Failed to write ${key}`, { cause });
      }
    },
    remove: (): Promise<void> => store.removeItem(key),
  };
}
