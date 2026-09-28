import type { Unsubscribe } from './types';

/**
 * Framework-agnostic observable state container. Compatible with React's `useSyncExternalStore`
 * (stable `getState` snapshot + `subscribe`). Basis for view models and MVI stores.
 */
export interface ReadableStore<S> {
  readonly getState: () => S;
  readonly subscribe: (listener: () => void) => Unsubscribe;
}

export interface WritableStore<S> extends ReadableStore<S> {
  readonly setState: (next: S | ((prev: S) => S)) => void;
}

export function createObservableStore<S>(
  initial: S,
  equals: (a: S, b: S) => boolean = Object.is,
): WritableStore<S> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState(next) {
      const value = typeof next === 'function' ? (next as (prev: S) => S)(state) : next;
      if (equals(state, value)) return;
      state = value;
      for (const l of [...listeners]) l();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
