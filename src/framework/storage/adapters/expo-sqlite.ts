import type { Database, SqlValue } from '../database';

/** Structural subset of `expo-sqlite`'s `SQLiteDatabase` (async API). */
export interface ExpoSQLiteLike {
  runAsync(sql: string, params: SqlValue[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync<T>(sql: string, params: SqlValue[]): Promise<T[]>;
  withExclusiveTransactionAsync?(fn: (tx: ExpoSQLiteLike) => Promise<void>): Promise<void>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}

export function createExpoSQLiteDatabase(db: ExpoSQLiteLike): Database {
  const wrap = (conn: ExpoSQLiteLike): Database => ({
    async execute(sql, params = []) {
      const r = await conn.runAsync(sql, [...params]);
      return { changes: r.changes, lastInsertId: r.lastInsertRowId };
    },
    query: <Row>(sql: string, params: readonly SqlValue[] = []) =>
      conn.getAllAsync<Row>(sql, [...params]),
    async transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T> {
      let result!: T;
      if (conn.withExclusiveTransactionAsync) {
        await conn.withExclusiveTransactionAsync(async (tx) => {
          result = await fn(wrap(tx));
        });
      } else {
        await conn.withTransactionAsync(async () => {
          result = await fn(wrap(conn));
        });
      }
      return result;
    },
    close: () => conn.closeAsync(),
  });
  return wrap(db);
}
