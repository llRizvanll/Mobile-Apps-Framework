export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

export type LogContext = Readonly<Record<string, unknown>>;

export interface LogRecord {
  readonly level: Exclude<LogLevel, 'silent'>;
  readonly message: string;
  readonly timestamp: number;
  readonly context: LogContext;
  readonly error?: unknown;
}

/** Destination for log records (console, file, remote, crash-reporter breadcrumbs, ...). */
export interface LogSink {
  write(record: LogRecord): void;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
  /** Derive a logger with bound context, e.g. `logger.child({ module: 'auth' })`. */
  child(context: LogContext): Logger;
}

export interface LoggerOptions {
  readonly level?: LogLevel;
  readonly sinks?: readonly LogSink[];
  readonly context?: LogContext;
  /** Keys (case-insensitive) whose values are masked before reaching any sink. */
  readonly redactKeys?: readonly string[];
  readonly now?: () => number;
}

export const DEFAULT_REDACT_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'secret',
  'apiKey',
  'email',
  'phone',
  'ssn',
  'cardNumber',
] as const;

export function redact(value: unknown, keys: ReadonlySet<string>, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, keys, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = keys.has(k.toLowerCase()) ? '[REDACTED]' : redact(v, keys, depth + 1);
  }
  return out;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const { level = 'info', sinks = [consoleSink], context = {}, now = Date.now } = options;
  const redactKeys = new Set(
    (options.redactKeys ?? DEFAULT_REDACT_KEYS).map((k) => k.toLowerCase()),
  );
  const threshold = LEVEL_WEIGHT[level];

  const emit = (
    lvl: LogRecord['level'],
    message: string,
    ctx?: LogContext,
    error?: unknown,
  ): void => {
    if (LEVEL_WEIGHT[lvl] < threshold) return;
    const record: LogRecord = {
      level: lvl,
      message,
      timestamp: now(),
      context: redact({ ...context, ...ctx }, redactKeys) as LogContext,
      ...(error !== undefined ? { error } : {}),
    };
    for (const sink of sinks) {
      try {
        sink.write(record);
      } catch {
        // A failing sink must never break the app.
      }
    }
  };

  return {
    debug: (m, c) => emit('debug', m, c),
    info: (m, c) => emit('info', m, c),
    warn: (m, c) => emit('warn', m, c),
    error: (m, e, c) => emit('error', m, c, e),
    child: (childContext) => createLogger({ ...options, context: { ...context, ...childContext } }),
  };
}

export const consoleSink: LogSink = {
  write({ level, message, context, error }) {
    const args: unknown[] = [`[${level.toUpperCase()}] ${message}`];
    if (Object.keys(context).length) args.push(context);
    if (error !== undefined) args.push(error);
    /* eslint-disable no-console */
    if (level === 'error') console.error(...args);
    else if (level === 'warn') console.warn(...args);
    else console.log(...args);
    /* eslint-enable no-console */
  },
};

/** Captures records in memory — for tests and in-app debug consoles. */
export class MemorySink implements LogSink {
  readonly records: LogRecord[] = [];
  constructor(private readonly limit = 500) {}
  write(record: LogRecord): void {
    this.records.push(record);
    if (this.records.length > this.limit) this.records.shift();
  }
}

export const noopLogger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  child: () => noopLogger,
};
