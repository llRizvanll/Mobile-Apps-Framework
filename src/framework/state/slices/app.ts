import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppPhase = 'booting' | 'ready' | 'failed';
export type AppActivity = 'active' | 'background' | 'inactive';

export interface AppShellState {
  readonly phase: AppPhase;
  readonly activity: AppActivity;
  readonly online: boolean;
  readonly bootError: string | null;
}

const initialState: AppShellState = {
  phase: 'booting',
  activity: 'active',
  online: true,
  bootError: null,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    bootSucceeded: (s) => {
      s.phase = 'ready';
      s.bootError = null;
    },
    bootFailed: (s, a: PayloadAction<string>) => {
      s.phase = 'failed';
      s.bootError = a.payload;
    },
    activityChanged: (s, a: PayloadAction<AppActivity>) => {
      s.activity = a.payload;
    },
    connectivityChanged: (s, a: PayloadAction<boolean>) => {
      s.online = a.payload;
    },
  },
  selectors: {
    selectPhase: (s) => s.phase,
    selectIsOnline: (s) => s.online,
  },
});

declare module '../registry' {
  interface RootStateRegistry {
    app: AppShellState;
  }
}
