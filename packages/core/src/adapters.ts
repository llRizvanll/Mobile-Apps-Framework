import type { AnalyticsProvider, CrashReporter, LogSink, SpanExporter } from '@org/observability';
import type { Database, KeyValueStore, SecureStore } from '@org/storage';
import type { HttpTransport, WebSocketFactory } from '@org/network';
import type { LayoutDirectionAdapter } from '@org/i18n';
import type { StreamingFetch } from '@org/ai';
import type { RemoteConfigProvider } from './flags';

/**
 * Platform/native bindings supplied by the app's composition root. Everything is optional with
 * safe in-memory / no-op defaults, so the framework runs unchanged in Jest, Storybook and Node.
 */
export interface PlatformAdapters {
  readonly keyValueStore?: KeyValueStore;
  readonly secureStore?: SecureStore;
  readonly database?: Database;
  readonly crashReporter?: CrashReporter;
  readonly analyticsProviders?: readonly AnalyticsProvider[];
  readonly logSinks?: readonly LogSink[];
  readonly spanExporters?: readonly SpanExporter[];
  readonly httpTransport?: HttpTransport;
  readonly webSocketFactory?: WebSocketFactory;
  readonly aiStreamingFetch?: StreamingFetch;
  readonly deviceLocales?: () => readonly string[];
  readonly layoutDirection?: LayoutDirectionAdapter;
  readonly remoteConfig?: RemoteConfigProvider;
}
