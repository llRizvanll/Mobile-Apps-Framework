import type { LogRecord, LogSink } from './logger';

export type Severity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface Breadcrumb {
  readonly category: string;
  readonly message: string;
  readonly level?: Severity;
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface CrashUser {
  readonly id: string;
  readonly [key: string]: unknown;
}

/** Port for crash/error reporting (Sentry, Crashlytics, Bugsnag, ... via adapters). */
export interface CrashReporter {
  captureException(error: unknown, context?: Readonly<Record<string, unknown>>): void;
  captureMessage(message: string, severity?: Severity): void;
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  setUser(user: CrashUser | null): void;
  setTag(key: string, value: string): void;
}

export const noopCrashReporter: CrashReporter = {
  captureException: () => undefined,
  captureMessage: () => undefined,
  addBreadcrumb: () => undefined,
  setUser: () => undefined,
  setTag: () => undefined,
};

/** Fans out to several reporters (e.g. Sentry + an internal endpoint). */
export const compositeCrashReporter = (reporters: readonly CrashReporter[]): CrashReporter => ({
  captureException: (e, c) => reporters.forEach((r) => r.captureException(e, c)),
  captureMessage: (m, s) => reporters.forEach((r) => r.captureMessage(m, s)),
  addBreadcrumb: (b) => reporters.forEach((r) => r.addBreadcrumb(b)),
  setUser: (u) => reporters.forEach((r) => r.setUser(u)),
  setTag: (k, v) => reporters.forEach((r) => r.setTag(k, v)),
});

/** Log sink that turns logs into breadcrumbs and errors into captured exceptions. */
export const crashReporterSink = (reporter: CrashReporter): LogSink => ({
  write(record: LogRecord) {
    if (record.level === 'error' && record.error !== undefined) {
      reporter.captureException(record.error, { message: record.message, ...record.context });
      return;
    }
    reporter.addBreadcrumb({
      category: 'log',
      message: record.message,
      level: record.level === 'warn' ? 'warning' : record.level,
      data: record.context,
    });
  },
});

interface RNErrorUtils {
  getGlobalHandler(): (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler(handler: (error: unknown, isFatal?: boolean) => void): void;
}

/** Hooks React Native's global JS error handler and unhandled promise rejections. */
export function installGlobalErrorHandlers(reporter: CrashReporter): () => void {
  const errorUtils = (globalThis as { ErrorUtils?: RNErrorUtils }).ErrorUtils;
  if (!errorUtils) return () => undefined;
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    reporter.captureException(error, { fatal: isFatal ?? false });
    previous(error, isFatal);
  });
  return () => errorUtils.setGlobalHandler(previous);
}
