/**
 * Framework error taxonomy. Every error that crosses a package boundary should be an `AppError`
 * so that UI, observability and retry logic can reason about it uniformly.
 */
export type ErrorCode =
  | 'unknown'
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'http'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'config'
  | 'storage'
  | 'graphql'
  | 'ai'
  | 'di'
  | (string & {});

export interface AppErrorOptions {
  readonly cause?: unknown;
  /** Whether repeating the same operation may succeed (drives retry policies). */
  readonly retryable?: boolean;
  /** Structured, non-PII diagnostic context. */
  readonly meta?: Readonly<Record<string, unknown>>;
  /** Safe-to-display message key for the UI layer (i18n key). */
  readonly userMessageKey?: string;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly meta: Readonly<Record<string, unknown>>;
  readonly userMessageKey: string | undefined;
  override readonly cause: unknown;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = options.cause;
    this.retryable = options.retryable ?? false;
    this.meta = options.meta ?? {};
    this.userMessageKey = options.userMessageKey;
  }

  static from(thrown: unknown, fallbackCode: ErrorCode = 'unknown'): AppError {
    if (thrown instanceof AppError) return thrown;
    if (thrown instanceof Error)
      return new AppError(fallbackCode, thrown.message, { cause: thrown });
    return new AppError(fallbackCode, String(thrown), { cause: thrown });
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      meta: this.meta,
    };
  }
}

export const isAppError = (value: unknown, code?: ErrorCode): value is AppError =>
  value instanceof AppError && (code === undefined || value.code === code);
