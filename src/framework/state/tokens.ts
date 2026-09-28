import { createToken } from '@framework/di';
import type { Reducer } from '@reduxjs/toolkit';
import type { AppStore } from './store';

export const AppStoreToken = createToken<AppStore>('state.AppStore');
/** Multi-binding: `{ key, reducer }` contributed by modules. */
export const ReducerContributionToken = createToken<{ key: string; reducer: Reducer }>(
  'state.Reducer[]',
);
