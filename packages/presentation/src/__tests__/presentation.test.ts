import { AppError } from '@org/foundation';
import { ViewModel, createMviStore } from '../index';

interface CounterState {
  count: number;
  loading: boolean;
  error: string | null;
}

class CounterViewModel extends ViewModel<CounterState> {
  constructor(private readonly load: () => Promise<number>) {
    super({ count: 0, loading: false, error: null });
  }
  protected override async onInit(): Promise<void> {
    this.setState({ loading: true });
    this.setState({ count: await this.load(), loading: false });
  }
  protected override onError(error: AppError): void {
    this.setState({ error: error.message, loading: false });
  }
  increment = (): void => this.setState((s) => ({ count: s.count + 1 }));
}

const tick = () => new Promise((r) => setTimeout(() => r(undefined), 0));

describe('ViewModel', () => {
  it('initialises once, updates state and routes errors', async () => {
    const vm = new CounterViewModel(() => Promise.resolve(5));
    vm.attach();
    vm.detach();
    vm.attach(); // StrictMode remount must not re-init or dispose
    await tick();
    vm.increment();
    expect(vm.state).toEqual({ count: 6, loading: false, error: null });
    expect(vm.disposed).toBe(false);

    const failing = new CounterViewModel(() => Promise.reject(new Error('offline')));
    failing.attach();
    await tick();
    expect(failing.state.error).toBe('offline');
  });

  it('disposes after the last detach and ignores late updates', async () => {
    let resolve!: (n: number) => void;
    const vm = new CounterViewModel(() => new Promise((r) => (resolve = r)));
    vm.attach();
    vm.detach();
    await tick();
    expect(vm.disposed).toBe(true);
    resolve(9);
    await tick();
    expect(vm.state.count).toBe(0);
  });
});

type TodoIntent =
  { type: 'add'; title: string } | { type: 'saved'; id: string } | { type: 'toggle'; id: string };
interface Todo {
  id: string;
  title: string;
  done: boolean;
}

describe('MviStore', () => {
  it('reduces intents, runs effects, and emits one-off effects', async () => {
    const transitions: string[] = [];
    const store = createMviStore<{ todos: Todo[] }, TodoIntent, { type: 'toast'; msg: string }>({
      initialState: { todos: [] },
      reduce: (s, i) => {
        switch (i.type) {
          case 'add':
            return { todos: [...s.todos, { id: 'tmp', title: i.title, done: false }] };
          case 'saved':
            return { todos: s.todos.map((t) => (t.id === 'tmp' ? { ...t, id: i.id } : t)) };
          case 'toggle':
            return { todos: s.todos.map((t) => (t.id === i.id ? { ...t, done: !t.done } : t)) };
        }
      },
      effects: async (i, ctx) => {
        if (i.type !== 'add') return;
        await Promise.resolve();
        ctx.dispatch({ type: 'saved', id: '42' });
        ctx.emit({ type: 'toast', msg: 'Saved' });
      },
      onTransition: (_p, i) => transitions.push(i.type),
    });
    const effects: string[] = [];
    store.onEffect((e) => effects.push(e.msg));
    store.dispatch({ type: 'add', title: 'Write tests' });
    await tick();
    store.dispatch({ type: 'toggle', id: '42' });
    expect(store.getState().todos).toEqual([{ id: '42', title: 'Write tests', done: true }]);
    expect(effects).toEqual(['Saved']);
    expect(transitions).toEqual(['add', 'saved', 'toggle']);
  });

  it('routes effect errors to onError', async () => {
    const onError = jest.fn();
    const store = createMviStore<number, 'go'>({
      initialState: 0,
      reduce: (s) => s + 1,
      effects: () => Promise.reject(new Error('x')),
      onError,
    });
    store.dispatch('go');
    await tick();
    expect(onError).toHaveBeenCalledWith(expect.any(AppError), 'go');
  });
});
