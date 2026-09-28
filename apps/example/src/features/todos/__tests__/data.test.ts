import { createHttpClient, type HttpTransport } from '@org/network';
import { MemoryKeyValueStore } from '@org/storage';
import { CachedTodoRepository } from '../data/CachedTodoRepository';
import { RestTodoRepository } from '../data/RestTodoRepository';

const dto = { id: 7, title: 'Ship it', completed: false, created_at: '2026-01-01T00:00:00.000Z' };

describe('todos data layer', () => {
  it('maps and validates API payloads', async () => {
    const transport: HttpTransport = (req) =>
      Promise.resolve({ status: 200, headers: {}, data: { items: [dto] }, request: req });
    const repo = new RestTodoRepository(
      createHttpClient({ baseUrl: 'https://api.test', transport }),
    );
    const res = await repo.list();
    expect(res.ok && res.value[0]).toEqual({
      id: '7',
      title: 'Ship it',
      completed: false,
      createdAt: new Date(dto.created_at),
    });
  });

  it('rejects malformed payloads as validation errors', async () => {
    const transport: HttpTransport = (req) =>
      Promise.resolve({ status: 200, headers: {}, data: { items: [{ id: 1 }] }, request: req });
    const res = await new RestTodoRepository(createHttpClient({ transport })).list();
    expect(!res.ok && res.error.code).toBe('validation');
  });

  it('serves the cached list when offline, but not for non-retryable errors', async () => {
    let mode: 'ok' | 'offline' | 'forbidden' = 'ok';
    const transport: HttpTransport = (req) => {
      if (mode === 'offline') return Promise.reject(new TypeError('Network request failed'));
      return Promise.resolve({
        status: mode === 'ok' ? 200 : 403,
        headers: {},
        data: { items: [dto] },
        request: req,
      });
    };
    const repo = new CachedTodoRepository(
      new RestTodoRepository(createHttpClient({ transport })),
      new MemoryKeyValueStore(),
    );
    expect((await repo.list()).ok).toBe(true);
    mode = 'offline';
    const cached = await repo.list();
    expect(cached.ok && cached.value[0]?.createdAt).toEqual(new Date(dto.created_at));
    mode = 'forbidden';
    expect((await repo.list()).ok).toBe(false);
  });
});
