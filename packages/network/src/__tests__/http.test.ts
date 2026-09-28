import { z } from 'zod';
import {
  auth,
  createHttpClient,
  retry,
  type HttpRequest,
  type HttpResponse,
  type HttpTransport,
} from '../index';

const respond = (
  req: HttpRequest,
  status: number,
  data: unknown = {},
  headers: Record<string, string> = {},
): HttpResponse => ({
  status,
  data,
  headers,
  request: req,
});

describe('HttpClient', () => {
  it('builds URLs, returns Ok results and validates with a parser', async () => {
    const transport = jest.fn<Promise<HttpResponse>, [HttpRequest]>((req) =>
      Promise.resolve(respond(req, 200, { id: 1 })),
    );
    const http = createHttpClient({ baseUrl: 'https://api.test/v1/', transport });
    const res = await http.get('/users', {
      query: { page: 2 },
      parser: z.object({ id: z.number() }),
    });
    expect(res.ok && res.value.data).toEqual({ id: 1 });
    expect(transport.mock.calls[0]?.[0].url).toBe('https://api.test/v1/users');
    expect(transport.mock.calls[0]?.[0].query).toEqual({ page: 2 });

    const bad = await http.get('/users', { parser: z.object({ id: z.string() }) });
    expect(!bad.ok && bad.error.code).toBe('validation');
  });

  it('maps non-2xx to typed errors without throwing', async () => {
    const http = createHttpClient({ transport: (req) => Promise.resolve(respond(req, 404)) });
    const res = await http.get('https://x.test/a');
    expect(!res.ok && res.error.code).toBe('not_found');
  });

  it('retries idempotent requests on 5xx but not POST', async () => {
    let calls = 0;
    const transport: HttpTransport = (req) =>
      Promise.resolve(respond(req, ++calls < 3 ? 503 : 200));
    const http = createHttpClient({
      transport,
      middleware: [retry({ retries: 3, baseMs: 1, jitter: 0 })],
    });
    expect((await http.get('/a')).ok).toBe(true);
    expect(calls).toBe(3);
    calls = 0;
    expect((await http.post('/a', {})).ok).toBe(false);
    expect(calls).toBe(1);
  });

  it('refreshes once for concurrent 401s and replays requests', async () => {
    let token = 'old';
    const refresh = jest.fn(async () => {
      await new Promise((r) => setTimeout(() => r(undefined), 5));
      token = 'new';
      return true;
    });
    const transport: HttpTransport = (req) =>
      Promise.resolve(respond(req, req.headers['Authorization'] === 'Bearer new' ? 200 : 401));
    const http = createHttpClient({
      transport,
      middleware: [
        auth({ tokens: { getAccessToken: () => Promise.resolve(token) }, refresh: { refresh } }),
      ],
    });
    const results = await Promise.all([http.get('/a'), http.get('/b'), http.get('/c')]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('calls onRefreshFailed and surfaces unauthorized when refresh fails', async () => {
    const onRefreshFailed = jest.fn();
    const http = createHttpClient({
      transport: (req) => Promise.resolve(respond(req, 401)),
      middleware: [
        auth({
          tokens: { getAccessToken: () => Promise.resolve('t') },
          refresh: { refresh: () => Promise.resolve(false), onRefreshFailed },
        }),
      ],
    });
    const res = await http.get('/a');
    expect(!res.ok && res.error.code).toBe('unauthorized');
    expect(onRefreshFailed).toHaveBeenCalled();
  });
});
