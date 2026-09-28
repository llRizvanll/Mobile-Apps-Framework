import { createToken } from '@framework/di';
import type { Database } from './database';
import type { KeyValueStore, SecureStore } from './kv';

/** General-purpose persistent KV (brand-namespaced by the framework). */
export const KeyValueStoreToken = createToken<KeyValueStore>('storage.KeyValueStore');
/** Secrets: tokens, credentials. Never persist secrets in `KeyValueStoreToken`. */
export const SecureStoreToken = createToken<SecureStore>('storage.SecureStore');
/** Optional local database. Bind only when a module needs relational/offline data. */
export const DatabaseToken = createToken<Database>('storage.Database');
