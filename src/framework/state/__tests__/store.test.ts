import { Container, createToken } from '@framework/di';
import { MemoryKeyValueStore } from '@framework/storage';
import { createSlice } from '@reduxjs/toolkit';
import {
  appSlice,
  createAppStore,
  createPersistence,
  settingsSlice,
  type AppThunk,
} from '../index';

const tick = (ms = 0) => new Promise((r) => setTimeout(() => r(undefined), ms));

describe('createAppStore', () => {
  it('includes shell slices and passes the DI resolver to thunks', () => {
    const Greeting = createToken<string>('Greeting');
    const container = new Container();
    container.bind(Greeting).toValue('hello');
    const { dispatch, getState } = createAppStore({ resolver: container });
    const thunk: AppThunk<string> = (_d, _g, { resolver }) => resolver.get(Greeting);
    expect(dispatch(thunk)).toBe('hello');
    expect(getState().app.phase).toBe('booting');
    dispatch(appSlice.actions.bootSucceeded());
    expect(appSlice.selectors.selectPhase(getState())).toBe('ready');
  });

  it('persists whitelisted slices, restores them and rehydrates lazily injected slices', async () => {
    const storage = new MemoryKeyValueStore();
    const counter = createSlice({
      name: 'counter',
      initialState: { n: 0 },
      reducers: {
        inc: (s) => {
          s.n++;
        },
      },
    });

    const p1 = createPersistence({ storage, whitelist: ['settings', 'counter'], throttleMs: 1 });
    const s1 = createAppStore({ resolver: new Container(), persistence: p1 });
    s1.injectReducer('counter', counter.reducer);
    s1.dispatch(settingsSlice.actions.themePreferenceChanged('dark'));
    s1.dispatch(counter.actions.inc());
    await tick(10);
    expect(JSON.parse((await storage.getItem('redux')) ?? '{}')).toMatchObject({ version: 1 });

    const p2 = createPersistence({ storage, whitelist: ['settings', 'counter'] });
    const s2 = createAppStore({ resolver: new Container(), persistence: p2 });
    s2.dispatch(await p2.restore());
    expect(s2.getState().settings.themePreference).toBe('dark');
    s2.injectReducer('counter', counter.reducer);
    expect((s2.getState() as unknown as { counter: { n: number } }).counter.n).toBe(1);
  });

  it('migrates old snapshots', async () => {
    const storage = new MemoryKeyValueStore({
      redux: JSON.stringify({ version: 1, state: { settings: { theme: 'dark' } } }),
    });
    const p = createPersistence({
      storage,
      whitelist: ['settings'],
      version: 2,
      migrate: (state) => ({
        settings: { themePreference: (state['settings'] as { theme: string }).theme },
      }),
    });
    const s = createAppStore({ resolver: new Container(), persistence: p });
    s.dispatch(await p.restore());
    expect(s.getState().settings.themePreference).toBe('dark');
  });
});
