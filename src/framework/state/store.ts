import type { Resolver } from '@framework/di';
import {
  combineReducers,
  configureStore,
  createListenerMiddleware,
  type Action,
  type Middleware,
  type Reducer,
  type ReducersMapObject,
  type ThunkAction,
  type ThunkDispatch,
  type UnknownAction,
} from '@reduxjs/toolkit';
import { withRehydration, type Persistence } from './persist';
import type { RootState } from './registry';
import { appSlice } from './slices/app';
import { sessionSlice } from './slices/session';
import { settingsSlice } from './slices/settings';

/** Thunks and listeners receive the DI resolver — business logic resolves use cases/repos from it. */
export interface ThunkExtra {
  readonly resolver: Resolver;
}

export type AppDispatch = ThunkDispatch<RootState, ThunkExtra, UnknownAction>;
export type AppThunk<R = void> = ThunkAction<R, RootState, ThunkExtra, Action>;

export const shellReducers = {
  [appSlice.reducerPath]: appSlice.reducer,
  [sessionSlice.reducerPath]: sessionSlice.reducer,
  [settingsSlice.reducerPath]: settingsSlice.reducer,
};

export interface CreateAppStoreOptions {
  readonly resolver: Resolver;
  readonly reducers?: ReducersMapObject;
  readonly middleware?: readonly Middleware[];
  readonly persistence?: Persistence;
  readonly devTools?: boolean;
  readonly preloadedState?: Partial<RootState>;
}

/**
 * Store factory. Shell slices are always present; features add reducers up-front or lazily via
 * `injectReducer`. The listener middleware is exposed for effect-style business logic.
 */
export function createAppStore(options: CreateAppStoreOptions) {
  const reducers: ReducersMapObject = { ...shellReducers, ...options.reducers };
  const build = (): Reducer => withRehydration(combineReducers(reducers));
  const extra: ThunkExtra = { resolver: options.resolver };
  const listener = createListenerMiddleware({ extra });

  const store = configureStore({
    reducer: build(),
    devTools: options.devTools ?? false,
    ...(options.preloadedState ? { preloadedState: options.preloadedState } : {}),
    middleware: (getDefault) =>
      getDefault({
        thunk: { extraArgument: extra },
        serializableCheck: { ignoredActions: ['@@framework/REHYDRATE'] },
      })
        .prepend(listener.middleware)
        .concat(
          ...(options.persistence ? [options.persistence.middleware] : []),
          ...(options.middleware ?? []),
        ),
  });

  return {
    store,
    dispatch: store.dispatch as AppDispatch,
    getState: () => store.getState() as RootState,
    listener,
    /** Adds a reducer at runtime (lazy feature modules) and rehydrates its persisted state. */
    injectReducer(key: string, reducer: Reducer): void {
      if (reducers[key] === reducer) return;
      reducers[key] = reducer;
      store.replaceReducer(build());
      const rehydrate = options.persistence?.rehydrateSlice(key);
      if (rehydrate) store.dispatch(rehydrate);
    },
  };
}

export type AppStore = ReturnType<typeof createAppStore>;
