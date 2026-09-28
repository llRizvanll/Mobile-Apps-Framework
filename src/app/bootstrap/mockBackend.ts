import type { HttpMethod, HttpRequest, HttpResponse, HttpTransport } from '@framework/network';
// <examples> removed by `npm run examples:remove`
import { exampleRoutes } from './mockExamples';
// </examples>

export interface MockReply {
  readonly status?: number;
  readonly data?: unknown;
}

export interface MockRoute {
  readonly method: HttpMethod;
  /** Path after the API base, with `:params`, e.g. `/orders/:id`. */
  readonly path: string;
  readonly handle: (
    req: HttpRequest,
    params: Readonly<Record<string, string>>,
  ) => MockReply | Promise<MockReply>;
}

export const route = (
  method: HttpMethod,
  path: string,
  handle: MockRoute['handle'],
): MockRoute => ({ method, path, handle });

/**
 * In-process fake API so the app runs with no server (`EXPO_PUBLIC_API_MODE=mock`, the default in
 * development). Add a route per endpoint your features call; keep it in sync with the real API.
 */
export const mockRoutes: MockRoute[] = [
  // route('GET', '/me', () => ({ data: { id: 'u1', name: 'Dev User' } })),
  // <examples>
  ...exampleRoutes(),
  // </examples>
];

export function createMockBackend(
  routes: readonly MockRoute[] = mockRoutes,
  latencyMs = 250,
): HttpTransport {
  const compiled = routes.map((r) => ({
    ...r,
    regex: new RegExp(`^${r.path.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`),
  }));
  return async (req) => {
    await new Promise((resolve) => setTimeout(() => resolve(undefined), latencyMs));
    // Strip the API base path (e.g. /v1) so routes are written relative to it.
    const path = new URL(req.url).pathname.replace(/^\/(v\d+|api)(?=\/)/, '');
    for (const r of compiled) {
      const match = r.method === req.method ? r.regex.exec(path) : null;
      if (!match) continue;
      const params = Object.fromEntries(
        Object.entries(match.groups ?? {}).map(([k, v]) => [k, decodeURIComponent(v)]),
      );
      const reply = await r.handle(req, params);
      return respond(req, reply.status ?? 200, reply.data ?? null);
    }
    return respond(req, 404, { error: `No mock route for ${req.method} ${path}` });
  };
}

const respond = (request: HttpRequest, status: number, data: unknown): HttpResponse => ({
  status,
  headers: { 'content-type': 'application/json' },
  data,
  request,
});
