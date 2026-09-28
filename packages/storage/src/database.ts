/**
 * Local relational database port (SQLite by default). Keep SQL inside repositories in the
 * data layer; domain code depends on repository interfaces, never on `Database`.
 */
export type SqlValue = string | number | boolean | null | Uint8Array;

export interface Database {
  execute(
    sql: string,
    params?: readonly SqlValue[],
  ): Promise<{ changes: number; lastInsertId?: number }>;
  query<Row>(sql: string, params?: readonly SqlValue[]): Promise<Row[]>;
  transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface Migration {
  /** Monotonic, never reused. */
  readonly version: number;
  readonly name: string;
  up(db: Database): Promise<void>;
}

/** Applies pending migrations in order inside transactions, tracking state in `_migrations`. */
export async function runMigrations(
  db: Database,
  migrations: readonly Migration[],
): Promise<number[]> {
  await db.execute(
    'CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL)',
  );
  const applied = new Set(
    (await db.query<{ version: number }>('SELECT version FROM _migrations')).map((r) => r.version),
  );
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  const versions = new Set<number>();
  for (const m of sorted) {
    if (versions.has(m.version)) throw new Error(`Duplicate migration version ${m.version}`);
    versions.add(m.version);
  }
  const ran: number[] = [];
  for (const m of sorted) {
    if (applied.has(m.version)) continue;
    await db.transaction(async (tx) => {
      await m.up(tx);
      await tx.execute('INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)', [
        m.version,
        m.name,
        Date.now(),
      ]);
    });
    ran.push(m.version);
  }
  return ran;
}

/** Generic repository contract for aggregate persistence. */
export interface Repository<T, Id = string> {
  findById(id: Id): Promise<T | undefined>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: Id): Promise<void>;
}
