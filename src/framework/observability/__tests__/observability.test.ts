import {
  MemoryAnalyticsProvider,
  MemorySink,
  MemorySpanExporter,
  createAnalytics,
  createLogger,
  createTracer,
  crashReporterSink,
  toTraceparent,
  type CrashReporter,
} from '../index';

describe('logger', () => {
  it('filters by level, binds child context and redacts PII', () => {
    const sink = new MemorySink();
    const log = createLogger({ level: 'info', sinks: [sink], context: { app: 'x' } });
    log.debug('hidden');
    log.child({ module: 'auth' }).info('login', { email: 'a@b.c', user: { password: 'p', id: 1 } });
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.context).toEqual({
      app: 'x',
      module: 'auth',
      email: '[REDACTED]',
      user: { password: '[REDACTED]', id: 1 },
    });
  });

  it('forwards errors to the crash reporter sink', () => {
    const reporter: CrashReporter = {
      captureException: jest.fn(),
      captureMessage: jest.fn(),
      addBreadcrumb: jest.fn(),
      setUser: jest.fn(),
      setTag: jest.fn(),
    };
    const log = createLogger({ level: 'debug', sinks: [crashReporterSink(reporter)] });
    log.info('step');
    log.error('failed', new Error('x'));
    expect(reporter.addBreadcrumb).toHaveBeenCalledTimes(1);
    expect(reporter.captureException).toHaveBeenCalledTimes(1);
  });
});

describe('analytics', () => {
  it('merges super props, respects consent and beforeSend', () => {
    const mem = new MemoryAnalyticsProvider();
    const analytics = createAnalytics({
      providers: [mem],
      superProps: { brand: 'acme' },
      beforeSend: (event, props) => (event === 'drop_me' ? null : props),
    });
    analytics.track('signed_up', { plan: 'pro' });
    analytics.track('drop_me');
    analytics.setEnabled(false);
    analytics.track('ignored');
    expect(mem.events).toEqual([
      { type: 'track', name: 'signed_up', props: { brand: 'acme', plan: 'pro' } },
    ]);
  });
});

describe('tracer', () => {
  it('records spans with durations, parents and error status', async () => {
    let t = 0;
    const exporter = new MemorySpanExporter();
    const tracer = createTracer({ exporters: [exporter], now: () => (t += 10) });
    const parent = tracer.startSpan('app.start');
    const child = tracer.startSpan('config.load', { parent });
    child.end();
    parent.end();
    await expect(tracer.withSpan('boom', () => Promise.reject(new Error('x')))).rejects.toThrow(
      'x',
    );
    expect(exporter.spans.map((s) => [s.name, s.status])).toEqual([
      ['config.load', 'ok'],
      ['app.start', 'ok'],
      ['boom', 'error'],
    ]);
    expect(exporter.spans[0]?.traceId).toBe(parent.traceId);
    expect(toTraceparent(parent)).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });
});
