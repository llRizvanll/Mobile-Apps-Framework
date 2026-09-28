import { createToken } from '@org/di';
import type { Analytics, AnalyticsProvider } from './analytics';
import type { CrashReporter } from './crash';
import type { Logger, LogSink } from './logger';
import type { SpanExporter, Tracer } from './tracing';

export const LoggerToken = createToken<Logger>('observability.Logger');
export const CrashReporterToken = createToken<CrashReporter>('observability.CrashReporter');
export const AnalyticsToken = createToken<Analytics>('observability.Analytics');
export const TracerToken = createToken<Tracer>('observability.Tracer');

/** Multi-binding extension points — adapters contribute, the framework composes. */
export const LogSinkToken = createToken<LogSink>('observability.LogSink[]');
export const AnalyticsProviderToken = createToken<AnalyticsProvider>(
  'observability.AnalyticsProvider[]',
);
export const SpanExporterToken = createToken<SpanExporter>('observability.SpanExporter[]');
