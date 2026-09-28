import { AppError, backoffDelay, sleep, type BackoffOptions } from '@framework/foundation';
import type { Logger, Tracer } from '@framework/observability';
import { toTraceparent } from '@framework/observability';
import { toNetworkError, type HttpMethod, type HttpRequest, type HttpResponse } from './types';

export type Next = (request: HttpRequest) => Promise<HttpResponse>;
/** Onion-style middleware. Listed outermost first. Throw `AppError`s; the client converts to `Result`. */
export type HttpMiddleware = (request: HttpRequest, next: Next) => Promise<HttpResponse>;

export const compose = (middleware: readonly HttpMiddleware[], terminal: Next): Next =>
  middleware.reduceRight<Next>((next, mw) => (req) => mw(req, next), terminal);

export const withHeaders =
  (headers: Record<string, string> | (() => Record<string, string>)): HttpMiddleware =>
  (req, next) =>
    next({
      ...req,
      headers: { ...(typeof headers === 'function' ? headers() : headers), ...req.headers },
    });

const IDEMPOTENT: ReadonlySet<HttpMethod> = new Set(['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS']);

export interface RetryOptions extends BackoffOptions {
  readonly retries?: number;
  readonly shouldRetry?: (error: AppError, request: HttpRequest, attempt: number) => boolean;
}

/** Retries retryable failures (network, timeout, 408/429/5xx) on idempotent methods, honouring Retry-After. */
export function retry(options: RetryOptions = {}): HttpMiddleware {
  const { retries = 2, shouldRetry } = options;
  return async (req, next) => {
    const max =
      req.meta.retry === false ? 0 : (req.meta.retry ?? (IDEMPOTENT.has(req.method) ? retries : 0));
    for (let attempt = 0; ; attempt++) {
      try {
        return await next(req);
      } catch (thrown) {
        const error = toNetworkError(thrown);
        const allowed = shouldRetry ? shouldRetry(error, req, attempt) : error.retryable;
        if (attempt >= max || !allowed || req.signal?.aborted) throw error;
        const retryAfter = Number((error.meta['retryAfter'] as string | undefined) ?? NaN);
        await sleep(
          Number.isFinite(retryAfter) ? retryAfter * 1000 : backoffDelay(attempt, options),
          req.signal,
        );
      }
    }
  };
}

export function logging(logger: Logger): HttpMiddleware {
  return async (req, next) => {
    const started = Date.now();
    const op = req.meta.operation ?? `${req.method} ${req.url}`;
    try {
      const res = await next(req);
      logger.debug('http.ok', { op, status: res.status, ms: Date.now() - started });
      return res;
    } catch (error) {
      logger.warn('http.fail', { op, code: AppError.from(error).code, ms: Date.now() - started });
      throw error;
    }
  };
}

/** Wraps each request in a span and propagates W3C `traceparent` to the backend. */
export function tracing(tracer: Tracer): HttpMiddleware {
  return (req, next) =>
    tracer.withSpan(
      `http ${req.meta.operation ?? req.method}`,
      async (span) => {
        const res = await next({
          ...req,
          headers: { ...req.headers, traceparent: toTraceparent(span) },
        });
        span.setAttribute('http.status', res.status);
        return res;
      },
      { 'http.method': req.method, 'http.url': req.url.split('?')[0] ?? req.url },
    );
}
