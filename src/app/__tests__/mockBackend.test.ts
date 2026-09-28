import { createHttpClient } from '@framework/network';
import { createMockBackend, route } from '../bootstrap/mockBackend';

describe('mock backend', () => {
  const http = createHttpClient({
    baseUrl: 'https://api.test/v1',
    transport: createMockBackend(
      [
        route('GET', '/orders/:id', (_req, { id }) => ({ data: { id } })),
        route('POST', '/orders', () => ({ status: 201, data: { ok: true } })),
      ],
      0,
    ),
  });

  it('routes by method and path params, relative to the API base path', async () => {
    const res = await http.get<{ id: string }>('/orders/a%2Fb');
    expect(res.ok && res.value.data).toEqual({ id: 'a/b' });
    const created = await http.post('/orders', {});
    expect(created.ok && created.value.status).toBe(201);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await http.get('/nope');
    expect(!res.ok && res.error.code).toBe('not_found');
  });
});
