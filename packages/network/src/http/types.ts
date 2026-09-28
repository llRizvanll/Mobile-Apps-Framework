import { AppError, type Parser } from '@org/foundation';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type QueryParams = Readonly<
  Record<string, string | number | boolean | null | undefined | readonly (string | number)[]>
>;

/** Per-request flags read by middleware. Extend via declaration merging for custom middleware. */
export interface RequestMeta {
  /** false disables retry; a number overrides the retry count. */
  retry?: false | number;
  /** Skip Authorization header (login, public endpoints). */
  skipAuth?: boolean;
  /** Set internally once the request has been replayed after a token refresh. */
  authRetried?: boolean;
  /** Logical operation name for logs/traces (defaults to `METHOD path`). */
  operation?: string;
  [key: string]: unknown;
}

export interface HttpRequest {
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly query?: QueryParams;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly meta: RequestMeta;
}

export interface HttpResponse<T = unknown> {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly data: T;
  readonly request: HttpRequest;
}

export interface RequestOptions<T = unknown> {
  readonly headers?: Record<string, string>;
  readonly query?: QueryParams;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly meta?: RequestMeta;
  /** Runtime validation of the response payload (zod schema or any `{ parse }`). */
  readonly parser?: Parser<T>;
}

export class HttpError extends AppError {
  readonly status: number;
  readonly response: HttpResponse | undefined;
  constructor(status: number, message: string, response?: HttpResponse) {
    super(
      status === 401
        ? 'unauthorized'
        : status === 403
          ? 'forbidden'
          : status === 404
            ? 'not_found'
            : 'http',
      message,
      {
        retryable: status === 408 || status === 429 || status >= 500,
        meta: {
          status,
          url: response?.request.url,
          method: response?.request.method,
          retryAfter: response?.headers['retry-after'],
        },
      },
    );
    this.name = 'HttpError';
    this.status = status;
    this.response = response;
  }
}

/**
 * Normalises anything thrown inside the HTTP pipeline. Non-AppError throws come from transports
 * (e.g. RN's `TypeError: Network request failed`) and are treated as retryable network failures.
 */
export const toNetworkError = (thrown: unknown): AppError =>
  thrown instanceof AppError
    ? thrown
    : new AppError('network', thrown instanceof Error ? thrown.message : 'Network request failed', {
        cause: thrown,
        retryable: true,
      });

export const isHttpError = (e: unknown, status?: number): e is HttpError =>
  e instanceof HttpError && (status === undefined || e.status === status);
