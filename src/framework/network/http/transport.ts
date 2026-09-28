import { AppError } from '@framework/foundation';
import type { HttpRequest, HttpResponse, QueryParams } from './types';

/** Low-level I/O port. Swap for tests (`MockTransport`), certificate pinning, or native stacks. */
export type HttpTransport = (request: HttpRequest) => Promise<HttpResponse>;

export function buildUrl(base: string | undefined, path: string, query?: QueryParams): string {
  const url =
    /^https?:\/\//i.test(path) || !base
      ? path
      : `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  if (!query) return url;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    const values = Array.isArray(v) ? v : [v];
    for (const item of values)
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(item))}`);
  }
  return parts.length ? `${url}${url.includes('?') ? '&' : '?'}${parts.join('&')}` : url;
}

type FetchFn = (input: string, init: RequestInit) => Promise<Response>;

const isBodyInit_ = (body: unknown): body is BodyInit_ =>
  typeof body === 'string' ||
  (typeof FormData !== 'undefined' && body instanceof FormData) ||
  (typeof Blob !== 'undefined' && body instanceof Blob) ||
  body instanceof ArrayBuffer ||
  (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams);

/** Default transport on top of `fetch`. JSON in/out by default; honours timeouts and abort. */
export function createFetchTransport(
  fetchImpl: FetchFn = (i, init) => fetch(i, init),
): HttpTransport {
  return async (request) => {
    const controller = new AbortController();
    const onAbort = (): void => controller.abort();
    request.signal?.addEventListener('abort', onAbort, { once: true });
    let timedOut = false;
    const timer = request.timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, request.timeoutMs)
      : undefined;

    const headers: Record<string, string> = { Accept: 'application/json', ...request.headers };
    let body: BodyInit_ | undefined;
    if (request.body !== undefined) {
      if (isBodyInit_(request.body)) body = request.body;
      else {
        body = JSON.stringify(request.body);
        headers['Content-Type'] ??= 'application/json';
      }
    }

    try {
      const res = await fetchImpl(buildUrl(undefined, request.url, request.query), {
        method: request.method,
        headers,
        signal: controller.signal,
        ...(body !== undefined ? { body } : {}),
      });
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key.toLowerCase()] = value;
      });
      const text = res.status === 204 || request.method === 'HEAD' ? '' : await res.text();
      const isJson = (resHeaders['content-type'] ?? '').includes('json');
      let data: unknown = text;
      if (isJson && text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }
      return { status: res.status, headers: resHeaders, data, request };
    } catch (cause) {
      if (timedOut)
        throw new AppError('timeout', `Request timed out after ${request.timeoutMs}ms`, {
          cause,
          retryable: true,
        });
      if (request.signal?.aborted) throw new AppError('aborted', 'Request aborted', { cause });
      throw new AppError(
        'network',
        cause instanceof Error ? cause.message : 'Network request failed',
        { cause, retryable: true },
      );
    } finally {
      if (timer) clearTimeout(timer);
      request.signal?.removeEventListener('abort', onAbort);
    }
  };
}
