import { AppError } from './errors';
import type { DeepPartial } from './types';

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/**
 * Immutable deep merge used for brand/theme/config overrides. Arrays are replaced, not merged,
 * and `undefined` in overrides never erases a base value.
 */
export function deepMerge<T>(base: T, ...overrides: (DeepPartial<NoInfer<T>> | undefined)[]): T {
  let out: unknown = base;
  for (const override of overrides) {
    if (override === undefined) continue;
    out = mergeTwo(out, override);
  }
  return out as T;
}

function mergeTwo(base: unknown, override: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(override))
    return override === undefined ? base : override;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    out[key] = mergeTwo(base[key], value);
  }
  return out;
}

export const deepFreeze = <T>(value: T): Readonly<T> => {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
};

export const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const abortError = (): AppError => new AppError('aborted', 'Sleep aborted');
    if (signal?.aborted) return reject(abortError());
    const id = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(id);
      reject(abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });

export interface BackoffOptions {
  readonly baseMs?: number;
  readonly maxMs?: number;
  readonly factor?: number;
  /** 0..1 — fraction of the delay randomised to avoid thundering herds. */
  readonly jitter?: number;
  readonly random?: () => number;
}

/** Exponential backoff delay for a zero-based attempt number. */
export function backoffDelay(attempt: number, options: BackoffOptions = {}): number {
  const { baseMs = 300, maxMs = 30_000, factor = 2, jitter = 0.2, random = Math.random } = options;
  const exp = Math.min(maxMs, baseMs * factor ** attempt);
  const delta = exp * jitter;
  return Math.max(0, Math.round(exp - delta + random() * delta * 2));
}

/** Coalesces concurrent calls into one in-flight promise (e.g. token refresh). */
export function singleFlight<T>(fn: () => Promise<T>): () => Promise<T> {
  let inflight: Promise<T> | undefined;
  return () => {
    inflight ??= fn().finally(() => {
      inflight = undefined;
    });
    return inflight;
  };
}

export const noop = (): void => undefined;

export const assertNever = (value: never, message = 'Unexpected value'): never => {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
};

let counter = 0;
/** Non-cryptographic unique id (correlation ids, span ids). */
export const createId = (prefix = ''): string =>
  `${prefix}${Date.now().toString(36)}${(counter++ % 1296).toString(36).padStart(2, '0')}${Math.random().toString(36).slice(2, 8)}`;
