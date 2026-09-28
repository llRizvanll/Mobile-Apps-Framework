# @org/storage

Key-value, secure and relational storage ports with adapters.

```ts
const onboarding = typedEntry<boolean>(kv, 'onboarding.done', {
  ttlMs: 86_400_000,
  parser: z.boolean(),
});
await onboarding.set(true);
```

| Token                | Port            | Adapters (structural, no hard deps)                                 |
| -------------------- | --------------- | ------------------------------------------------------------------- |
| `KeyValueStoreToken` | `KeyValueStore` | `createMMKVStore`, `createAsyncStorageStore`, `MemoryKeyValueStore` |
| `SecureStoreToken`   | `SecureStore`   | `createExpoSecureStore` (keeps a key index)                         |
| `DatabaseToken`      | `Database`      | `createExpoSQLiteDatabase`; `runMigrations(db, migrations)`         |

The framework namespaces stores per brand (`namespaced(store, 'acme:')`).
