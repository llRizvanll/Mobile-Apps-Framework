export type SpanStatus = 'ok' | 'error' | 'cancelled';
export type SpanAttributes = Record<string, string | number | boolean>;

export interface Span {
  readonly name: string;
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId: string | undefined;
  setAttribute(key: string, value: string | number | boolean): void;
  end(status?: SpanStatus): void;
}

export interface FinishedSpan {
  readonly name: string;
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId: string | undefined;
  readonly startTime: number;
  readonly endTime: number;
  readonly durationMs: number;
  readonly status: SpanStatus;
  readonly attributes: Readonly<SpanAttributes>;
}

/** Receives finished spans (OpenTelemetry exporter, Sentry performance, custom backend...). */
export interface SpanExporter {
  export(span: FinishedSpan): void;
}

/** Port for performance tracing: app start, screen TTI, network calls, AI calls, DB queries. */
export interface Tracer {
  startSpan(name: string, options?: { attributes?: SpanAttributes; parent?: Span }): Span;
  withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: SpanAttributes,
  ): Promise<T>;
}

const hex = (bytes: number): string => {
  let out = '';
  for (let i = 0; i < bytes; i++)
    out += Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0');
  return out;
};

/** W3C `traceparent` header value for distributed tracing across mobile → backend. */
export const toTraceparent = (span: Pick<Span, 'traceId' | 'spanId'>): string =>
  `00-${span.traceId}-${span.spanId}-01`;

export function createTracer(
  options: { exporters?: readonly SpanExporter[]; now?: () => number } = {},
): Tracer {
  const { exporters = [], now = () => Date.now() } = options;

  const startSpan: Tracer['startSpan'] = (name, opts = {}) => {
    const startTime = now();
    const attributes: SpanAttributes = { ...opts.attributes };
    let ended = false;
    const span: Span = {
      name,
      traceId: opts.parent?.traceId ?? hex(16),
      spanId: hex(8),
      parentSpanId: opts.parent?.spanId,
      setAttribute: (k, v) => {
        attributes[k] = v;
      },
      end: (status = 'ok') => {
        if (ended) return;
        ended = true;
        const endTime = now();
        const finished: FinishedSpan = {
          name,
          traceId: span.traceId,
          spanId: span.spanId,
          parentSpanId: span.parentSpanId,
          startTime,
          endTime,
          durationMs: endTime - startTime,
          status,
          attributes,
        };
        for (const e of exporters) e.export(finished);
      },
    };
    return span;
  };

  return {
    startSpan,
    async withSpan(name, fn, attributes) {
      const span = startSpan(name, attributes ? { attributes } : {});
      try {
        const result = await fn(span);
        span.end('ok');
        return result;
      } catch (error) {
        span.setAttribute('error', error instanceof Error ? error.message : String(error));
        span.end('error');
        throw error;
      }
    },
  };
}

export class MemorySpanExporter implements SpanExporter {
  readonly spans: FinishedSpan[] = [];
  export(span: FinishedSpan): void {
    this.spans.push(span);
  }
}
