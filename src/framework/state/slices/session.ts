import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type SessionStatus = 'unknown' | 'anonymous' | 'authenticated';

/** Non-secret session facts. Tokens live in SecureStore, never in Redux. */
export interface SessionState {
  readonly status: SessionStatus;
  readonly userId: string | null;
}

const initialState: SessionState = { status: 'unknown', userId: null };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    signedIn: (s, a: PayloadAction<{ userId: string }>) => {
      s.status = 'authenticated';
      s.userId = a.payload.userId;
    },
    signedOut: (): SessionState => ({ status: 'anonymous', userId: null }),
  },
  selectors: {
    selectIsAuthenticated: (s) => s.status === 'authenticated',
    selectUserId: (s) => s.userId,
  },
});

declare module '../registry' {
  interface RootStateRegistry {
    session: SessionState;
  }
}
