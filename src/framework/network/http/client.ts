import { AppError, err, ok, type Result } from '@framework/foundation';
import { compose, type HttpMiddleware } from './middleware';
import { buildUrl, createFetchTransport, type HttpTransport } from './transport';
import {
  HttpError,
  toNetworkError,
  type HttpMethod,
  type HttpRequest,
  type HttpResponse,
  type RequestOptions,
} from './types';

export type HttpResult<T> = Result<HttpResponse<T>, AppError>;

export interface HttpClient {
  request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions<T>,
  ): Promise<HttpResult<T>>;
  get<T>(path: string, options?: RequestOptions<T>): Promise<HttpResult<T>>;
  delete<T>(path: string, options?: RequestOptions<T>): Promise<HttpResult<T>>;
  post<T>(path: string, body?: unknown, options?: RequestOptions<T>): Promise<HttpResult<T>>;
  put<T>(path: string, body?: unknown, options?: RequestOptions<T>): Promise<HttpResult<T>>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions<T>): Promise<HttpResult<T>>;
  /** Derive a client with extra middleware (appended innermost) or a different base URL. */
  extend(options: { baseUrl?: string; middleware?: readonly HttpMiddleware[] }): HttpClient;
}

export interface HttpClientOptions {
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly headers?: Record<string, string>;
  readonly middleware?: readonly HttpMiddleware[];
  readonly transport?: HttpTransport;
}

/**
 * REST client. Never throws for HTTP/network failures — returns `Result<HttpResponse<T>, AppError>`.
 * Pipeline: middleware (outermost first) → status check → transport.
 */
export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const {
    baseUrl,
    timeoutMs = 30_000,
    headers = {},
    middleware = [],
    transport = createFetchTransport(),
  } = options;

  const terminal = async (req: HttpRequest): Promise<HttpResponse> => {
    const res = await transport(req);
    if (res.status >= 200 && res.status < 300) return res;
    throw new HttpError(res.status, `HTTP ${res.status} ${req.method} ${req.url}`, res);
  };
  const pipeline = compose(middleware, terminal);

  const request: HttpClient['request'] = async <T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    opts: RequestOptions<T> = {},
  ) => {
    const req: HttpRequest = {
      method,
      url: buildUrl(baseUrl, path),
      headers: { ...headers, ...opts.headers },
      timeoutMs: opts.timeoutMs ?? timeoutMs,
      meta: { ...opts.meta },
      ...(opts.query ? { query: opts.query } : {}),
      ...(opts.signal ? { signal: opts.signal } : {}),
      ...(body !== undefined ? { body } : {}),
    };
    try {
      const res = await pipeline(req);
      if (!opts.parser) return ok(res as HttpResponse<T>);
      try {
        return ok({ ...res, data: opts.parser.parse(res.data) });
      } catch (cause) {
        return err(
          new AppError('validation', `Response validation failed for ${method} ${path}`, { cause }),
        );
      }
    } catch (thrown) {
      return err(toNetworkError(thrown));
    }
  };

  return {
    request,
    get: (p, o) => request('GET', p, undefined, o),
    delete: (p, o) => request('DELETE', p, undefined, o),
    post: (p, b, o) => request('POST', p, b, o),
    put: (p, b, o) => request('PUT', p, b, o),
    patch: (p, b, o) => request('PATCH', p, b, o),
    extend: (ext) =>
      createHttpClient({
        ...options,
        ...(ext.baseUrl !== undefined ? { baseUrl: ext.baseUrl } : {}),
        middleware: [...middleware, ...(ext.middleware ?? [])],
      }),
  };
}
