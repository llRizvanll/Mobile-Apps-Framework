import { singleFlight } from '@framework/foundation';
import type { HttpMiddleware } from './middleware';
import { HttpError } from './types';

/** Supplies the current access token (usually backed by SecureStore). */
export interface AccessTokenProvider {
  getAccessToken(): Promise<string | null>;
}

/**
 * Port the app implements to refresh credentials. The network layer never knows *how*
 * tokens are refreshed (OAuth, custom endpoint, SSO) — only *when*.
 */
export interface AuthRefreshPort {
  /** Returns true when new credentials are available. */
  refresh(): Promise<boolean>;
  /** Called when refresh fails — typically dispatches logout. */
  onRefreshFailed?(): void;
}

export interface AuthMiddlewareOptions {
  readonly tokens: AccessTokenProvider;
  readonly refresh?: AuthRefreshPort;
  readonly header?: string;
  readonly scheme?: string;
}

/**
 * Attaches the bearer token and transparently refreshes on 401. Concurrent 401s share a
 * single refresh (single-flight) and each original request is replayed once.
 */
export function auth(options: AuthMiddlewareOptions): HttpMiddleware {
  const { tokens, refresh, header = 'Authorization', scheme = 'Bearer' } = options;
  const refreshOnce = refresh ? singleFlight(() => refresh.refresh()) : undefined;

  return async (req, next) => {
    if (req.meta.skipAuth) return next(req);
    const token = await tokens.getAccessToken();
    const withToken = token
      ? { ...req, headers: { ...req.headers, [header]: `${scheme} ${token}` } }
      : req;
    try {
      return await next(withToken);
    } catch (error) {
      if (
        !(error instanceof HttpError) ||
        error.status !== 401 ||
        !refreshOnce ||
        req.meta.authRetried
      )
        throw error;
      const refreshed = await refreshOnce().catch(() => false);
      if (!refreshed) {
        refresh?.onRefreshFailed?.();
        throw error;
      }
      const fresh = await tokens.getAccessToken();
      return next({
        ...req,
        headers: fresh ? { ...req.headers, [header]: `${scheme} ${fresh}` } : req.headers,
        meta: { ...req.meta, authRetried: true },
      });
    }
  };
}
