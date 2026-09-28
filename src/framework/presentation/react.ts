import { useEffect, useEffectEvent, useState, useSyncExternalStore } from 'react';
import type { ReadableStore } from '@framework/foundation';
import type { MviStore } from './mvi';
import type { ViewModel } from './view-model';

/** Subscribes to any `ReadableStore` (view model, MVI store, observable). */
export function useStoreState<S>(store: ReadableStore<S>): S {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** Selects a slice to limit re-renders. `selector` should be stable or cheap. */
export function useStoreSelector<S, R>(store: ReadableStore<S>, selector: (s: S) => R): R {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

type AnyViewModel = Pick<ViewModel<object>, 'getState' | 'subscribe' | 'attach' | 'detach'>;
export type StateOf<VM extends AnyViewModel> = ReturnType<VM['getState']>;

/**
 * Creates a view model once per component, runs `onInit`, disposes on unmount.
 * State type is inferred from the view model:
 *   const [state, vm] = useViewModel(() => new LoginViewModel(resolver.get(LoginUseCaseToken)));
 */
export function useViewModel<VM extends AnyViewModel>(
  factory: () => VM,
): readonly [StateOf<VM>, VM] {
  const [vm] = useState(factory);
  useEffect(() => {
    vm.attach();
    return () => vm.detach();
  }, [vm]);
  return [useStoreState(vm) as StateOf<VM>, vm] as const;
}

/** Creates an MVI store for the component's lifetime: `const [state, dispatch] = useMvi(() => createTodoStore(...))`. */
export function useMvi<S, I, E>(
  factory: () => MviStore<S, I, E>,
): readonly [S, (intent: I) => void, MviStore<S, I, E>] {
  const [store] = useState(factory);
  useEffect(() => () => store.dispose(), [store]);
  const [dispatch] = useState(() => (intent: I) => store.dispatch(intent));
  return [useStoreState(store), dispatch, store] as const;
}

/** Handles one-off MVI effects (navigation, toasts) with the latest handler. */
export function useMviEffects<E>(
  store: { onEffect(listener: (e: E) => void): () => void },
  handler: (effect: E) => void,
): void {
  const onEffect = useEffectEvent(handler);
  useEffect(() => store.onEffect((e) => onEffect(e)), [store]);
}
