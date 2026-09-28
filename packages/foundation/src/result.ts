/**
 * Explicit success/failure value. Data-layer APIs return `Result` instead of throwing so that
 * failure paths are visible in types and exhaustively handled by callers.
 */
export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;

export const mapResult = <T, U, E>(r: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
  r.ok ? ok(fn(r.value)) : r;

export const mapError = <T, E, F>(r: Result<T, E>, fn: (error: E) => F): Result<T, F> =>
  r.ok ? r : err(fn(r.error));

export const andThen = <T, U, E>(r: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> =>
  r.ok ? fn(r.value) : r;

export const unwrapOr = <T, E>(r: Result<T, E>, fallback: T): T => (r.ok ? r.value : fallback);

/** Returns the value or throws the error. Use at boundaries (e.g. thunks) where throwing is idiomatic. */
export const unwrap = <T, E>(r: Result<T, E>): T => {
  if (r.ok) return r.value;
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- E is caller-defined; errors in this codebase are AppError
  throw r.error;
};

export const match = <T, E, R>(
  r: Result<T, E>,
  handlers: { ok: (value: T) => R; err: (error: E) => R },
): R => (r.ok ? handlers.ok(r.value) : handlers.err(r.error));

/** Runs an async function and captures a thrown error as `Err`, normalised via `mapThrown`. */
export async function tryCatch<T, E = Error>(
  fn: () => Promise<T> | T,
  mapThrown: (thrown: unknown) => E = (t) => toError(t) as E,
): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (thrown) {
    return err(mapThrown(thrown));
  }
}

export const toError = (thrown: unknown): Error =>
  thrown instanceof Error
    ? thrown
    : new Error(typeof thrown === 'string' ? thrown : JSON.stringify(thrown));
