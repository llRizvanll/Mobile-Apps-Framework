import type { KeyValueStore } from '@framework/storage';
import type { Middleware, Reducer, UnknownAction } from '@reduxjs/toolkit';

export const REHYDRATE = '@@framework/REHYDRATE';

export interface RehydrateAction extends UnknownAction {
  readonly type: typeof REHYDRATE;
  readonly payload: Readonly<Record<string, unknown>>;
}

const isRehydrate = (a: UnknownAction): a is RehydrateAction => a.type === REHYDRATE;

export interface PersistConfig {
  readonly storage: KeyValueStore;
  /** Storage key for the snapshot. */
  readonly key?: string;
  /** Slice names to persist. Explicit allow-list — nothing is persisted by default. */
  readonly whitelist: readonly string[];
  /** Bump when persisted shapes change; `migrate` upgrades older snapshots. */
  readonly version?: number;
  readonly migrate?: (
    state: Record<string, unknown>,
    fromVersion: number,
  ) => Record<string, unknown>;
  readonly throttleMs?: number;
}

interface Snapshot {
  readonly version: number;
  readonly state: Record<string, unknown>;
}

/** Wraps the root reducer so REHYDRATE shallow-merges persisted slice state over initial state. */
export const withRehydration =
  <S>(reducer: Reducer<S>): Reducer<S> =>
  (state, action) => {
    const next = reducer(state, action);
    if (!isRehydrate(action)) return next;
    const merged = { ...(next as Record<string, unknown>) };
    for (const [key, value] of Object.entries(action.payload)) {
      const current = merged[key];
      merged[key] =
        current && typeof current === 'object' && value && typeof value === 'object'
          ? { ...current, ...value }
          : value;
    }
    return merged as S;
  };

/**
 * Lightweight, dependency-free persistence (replaces redux-persist):
 * versioned snapshots, migrations, allow-list, throttled writes, late-injected slices.
 */
export function createPersistence(config: PersistConfig) {
  const { storage, key = 'redux', whitelist, version = 1, migrate, throttleMs = 500 } = config;
  let restored: Record<string, unknown> = {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastWritten: Record<string, unknown> = {};

  const pick = (state: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(whitelist.filter((k) => k in state).map((k) => [k, state[k]]));

  const write = async (state: Record<string, unknown>): Promise<void> => {
    const snapshot: Snapshot = { version, state: pick(state) };
    lastWritten = snapshot.state;
    await storage.setItem(key, JSON.stringify(snapshot));
  };

  const middleware: Middleware = (api) => (next) => (action) => {
    const result = next(action);
    const state = api.getState() as Record<string, unknown>;
    const changed = whitelist.some((k) => state[k] !== lastWritten[k]);
    if (changed && !isRehydrate(action as UnknownAction)) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void write(state).catch(() => undefined), throttleMs);
    }
    return result;
  };

  return {
    middleware,
    /** Loads the snapshot (running migrations) and returns the REHYDRATE action to dispatch. */
    async restore(): Promise<RehydrateAction> {
      try {
        const raw = await storage.getItem(key);
        if (raw) {
          const snap = JSON.parse(raw) as Snapshot;
          restored =
            snap.version === version
              ? snap.state
              : migrate
                ? migrate(snap.state, snap.version)
                : {};
        }
      } catch {
        restored = {};
      }
      return { type: REHYDRATE, payload: pick(restored) };
    },
    /** REHYDRATE payload for a slice injected after start-up (lazy feature modules). */
    rehydrateSlice(sliceKey: string): RehydrateAction | undefined {
      return whitelist.includes(sliceKey) && sliceKey in restored
        ? { type: REHYDRATE, payload: { [sliceKey]: restored[sliceKey] } }
        : undefined;
    },
    /** Immediately writes pending state (call when the app goes to background). */
    async flush(state: Record<string, unknown>): Promise<void> {
      if (timer) clearTimeout(timer);
      await write(state);
    },
    async purge(): Promise<void> {
      restored = {};
      await storage.removeItem(key);
    },
  };
}

export type Persistence = ReturnType<typeof createPersistence>;
