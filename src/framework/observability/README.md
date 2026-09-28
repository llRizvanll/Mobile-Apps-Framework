# @framework/observability

Logging, crash reporting, analytics and tracing behind ports.

| Port                | Default                          | Implement for                     |
| ------------------- | -------------------------------- | --------------------------------- |
| `LogSink`           | console (non-prod), `MemorySink` | Datadog, file, remote             |
| `CrashReporter`     | no-op                            | Sentry, Crashlytics, Bugsnag      |
| `AnalyticsProvider` | —                                | Segment, Amplitude, Firebase      |
| `SpanExporter`      | —                                | OpenTelemetry, Sentry performance |

- Logger redacts PII keys (`password`, `token`, `email`, …) before sinks; `child({ module })` context.
- `createAnalytics` = consent-aware composite with super-props and `beforeSend` scrubbing.
- Typed events: `declare module '@framework/observability' { interface AnalyticsEventMap { checkout: { total: number } } }`.
- `tracer.withSpan(name, fn)`; `toTraceparent(span)` for W3C propagation (the HTTP client does this).
- `installGlobalErrorHandlers(reporter)` hooks RN's global JS handler.
