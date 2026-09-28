import {
  AppError,
  Emitter,
  backoffDelay,
  createObservableStore,
  deepMerge,
  err,
  mapResult,
  ok,
  singleFlight,
  tryCatch,
  unwrapOr,
} from '../index';

describe('Result', () => {
  it('maps ok values and passes errors through', () => {
    expect(mapResult(ok(2), (n) => n * 2)).toEqual(ok(4));
    expect(mapResult<number, number, string>(err('x'), (n) => n * 2)).toEqual(err('x'));
    expect(unwrapOr(err('boom'), 7)).toBe(7);
  });

  it('captures thrown errors with tryCatch', async () => {
    const r = await tryCatch(() => Promise.reject(new Error('nope')));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('nope');
  });
});

describe('AppError', () => {
  it('wraps unknown throwables', () => {
    const e = AppError.from(new TypeError('bad'), 'network');
    expect(e.code).toBe('network');
    expect(e.cause).toBeInstanceOf(TypeError);
    expect(AppError.from(e)).toBe(e);
  });
});

describe('deepMerge', () => {
  it('merges nested objects immutably and replaces arrays', () => {
    const base = { a: { b: 1, c: [1, 2] }, d: 'x' };
    const merged = deepMerge(base, { a: { c: [3] } }, { d: 'y' });
    expect(merged).toEqual({ a: { b: 1, c: [3] }, d: 'y' });
    expect(base.a.c).toEqual([1, 2]);
  });
});

describe('Emitter', () => {
  it('delivers typed events and supports once/unsubscribe', () => {
    const e = new Emitter<{ ping: number }>();
    const seen: number[] = [];
    const off = e.on('ping', (n) => seen.push(n));
    e.once('ping', (n) => seen.push(n * 10));
    e.emit('ping', 1);
    off();
    e.emit('ping', 2);
    expect(seen).toEqual([1, 10]);
  });
});

describe('ObservableStore', () => {
  it('notifies only on change', () => {
    const store = createObservableStore(0);
    const listener = jest.fn();
    store.subscribe(listener);
    store.setState(0);
    store.setState((n) => n + 1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState()).toBe(1);
  });
});

describe('utils', () => {
  it('computes bounded backoff', () => {
    expect(backoffDelay(0, { jitter: 0 })).toBe(300);
    expect(backoffDelay(3, { jitter: 0 })).toBe(2400);
    expect(backoffDelay(50, { jitter: 0, maxMs: 1000 })).toBe(1000);
  });

  it('coalesces concurrent calls with singleFlight', async () => {
    const fn = jest.fn(() => Promise.resolve(42));
    const run = singleFlight(fn);
    const [a, b] = await Promise.all([run(), run()]);
    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
