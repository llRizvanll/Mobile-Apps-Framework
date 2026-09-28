import type { HttpMethod, HttpRequest, HttpResponse, HttpTransport } from '@framework/network';

type Matcher = string | RegExp | ((url: string) => boolean);
type Reply =
  | { status?: number; data?: unknown; headers?: Record<string, string> }
  | ((req: HttpRequest) => MockReply | Promise<MockReply>);
type MockReply = { status?: number; data?: unknown; headers?: Record<string, string> };

interface Route {
  readonly method: HttpMethod | '*';
  readonly match: Matcher;
  readonly reply: Reply;
  once: boolean;
  used: boolean;
}

/**
 * Declarative HTTP double. Routes match by method + URL (substring, regex or predicate);
 * unmatched requests fail loudly with a 501 so missing stubs are obvious.
 *
 *   transport.on('GET', '/me', { data: { id: '1' } });
 *   transport.onceOn('POST', /login$/, (req) => ({ status: 401 }));
 */
export class MockTransport {
  readonly requests: HttpRequest[] = [];
  private readonly routes: Route[] = [];

  readonly transport: HttpTransport = async (req) => {
    this.requests.push(req);
    const route = this.routes.find(
      (r) =>
        !(r.once && r.used) &&
        (r.method === '*' || r.method === req.method) &&
        matches(r.match, req.url),
    );
    if (!route)
      return respond(req, { status: 501, data: { error: `No mock for ${req.method} ${req.url}` } });
    route.used = true;
    const reply = typeof route.reply === 'function' ? await route.reply(req) : route.reply;
    return respond(req, reply);
  };

  on(method: HttpMethod | '*', match: Matcher, reply: Reply): this {
    this.routes.push({ method, match, reply, once: false, used: false });
    return this;
  }

  onceOn(method: HttpMethod | '*', match: Matcher, reply: Reply): this {
    this.routes.unshift({ method, match, reply, once: true, used: false });
    return this;
  }

  reset(): void {
    this.routes.length = 0;
    this.requests.length = 0;
  }

  last(): HttpRequest | undefined {
    return this.requests[this.requests.length - 1];
  }
}

const matches = (m: Matcher, url: string): boolean =>
  typeof m === 'string' ? url.includes(m) : m instanceof RegExp ? m.test(url) : m(url);

const respond = (request: HttpRequest, r: MockReply): HttpResponse => ({
  status: r.status ?? 200,
  headers: { 'content-type': 'application/json', ...r.headers },
  data: r.data ?? null,
  request,
});
