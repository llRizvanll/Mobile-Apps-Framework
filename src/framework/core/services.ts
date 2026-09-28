import {
  AIClientToken,
  ToolRegistry,
  ToolRegistryToken,
  createHttpProxyAIClient,
  withObservability,
} from '@framework/ai';
import { defineServiceModule, type Resolver } from '@framework/di';
import { I18nToken, createI18n, type TranslationTree } from '@framework/i18n';
import {
  AccessTokenProviderToken,
  AuthRefreshPortToken,
  GraphQLClientToken,
  GraphQLSubscriptionClientToken,
  GraphQLSubscriptionClient,
  HttpClientToken,
  HttpMiddlewareToken,
  WebSocketClient,
  WebSocketClientToken,
  auth,
  createFetchTransport,
  createGraphQLClient,
  createHttpClient,
  logging,
  retry,
  tracing,
  withHeaders,
  type HttpMiddleware,
} from '@framework/network';
import {
  AnalyticsProviderToken,
  AnalyticsToken,
  CrashReporterToken,
  LogSinkToken,
  LoggerToken,
  SpanExporterToken,
  TracerToken,
  consoleSink,
  createAnalytics,
  createLogger,
  createTracer,
  crashReporterSink,
  noopCrashReporter,
} from '@framework/observability';
import {
  DatabaseToken,
  KeyValueStoreToken,
  MemoryKeyValueStore,
  SecureStoreToken,
  namespaced,
} from '@framework/storage';
import { createBrandTheme } from '@framework/theme';
import { frameworkTranslations } from '@framework/ui';
import { deepMerge } from '@framework/foundation';
import type { PlatformAdapters } from './adapters';
import type { BrandDefinition } from './config/brand';
import type { BrandConfig } from './config/schema';
import type { FrameworkModule } from './module';
import {
  BrandConfigToken,
  BrandThemeToken,
  PlatformAdaptersToken,
  UIOverridesToken,
} from './tokens';

const mergeTranslations = (
  ...sources: (Readonly<Record<string, TranslationTree>> | undefined)[]
): Record<string, TranslationTree> => {
  const out: Record<string, TranslationTree> = {};
  for (const src of sources)
    for (const [locale, tree] of Object.entries(src ?? {}))
      out[locale] = deepMerge(out[locale] ?? {}, tree);
  return out;
};

/**
 * Framework services as a single DI module. Every binding can be overridden by later modules
 * (feature modules, brand modules, tests) because the container is last-write-wins.
 */
export function frameworkServices(
  config: BrandConfig,
  brand: BrandDefinition,
  adapters: PlatformAdapters,
  modules: readonly FrameworkModule[],
) {
  return defineServiceModule('framework', (c) => {
    c.bind(BrandConfigToken).toValue(config);
    c.bind(PlatformAdaptersToken).toValue(adapters);
    c.bind(BrandThemeToken).toFactory(() => createBrandTheme(brand.theme));
    c.bind(UIOverridesToken).toValue(brand.components ?? {});

    // ── Observability ────────────────────────────────────────────────────────
    for (const sink of adapters.logSinks ?? []) c.bindMulti(LogSinkToken).toValue(sink);
    for (const p of adapters.analyticsProviders ?? [])
      c.bindMulti(AnalyticsProviderToken).toValue(p);
    for (const e of adapters.spanExporters ?? []) c.bindMulti(SpanExporterToken).toValue(e);
    c.bind(CrashReporterToken).toValue(adapters.crashReporter ?? noopCrashReporter);
    c.bind(LoggerToken).toFactory((r) =>
      createLogger({
        level: config.observability.logLevel,
        context: { brand: config.id, env: config.environment },
        sinks: [
          ...(config.environment === 'production' ? [] : [consoleSink]),
          crashReporterSink(r.get(CrashReporterToken)),
          ...r.getAll(LogSinkToken),
        ],
      }),
    );
    c.bind(TracerToken).toFactory((r) => createTracer({ exporters: r.getAll(SpanExporterToken) }));
    c.bind(AnalyticsToken).toFactory((r) =>
      createAnalytics({
        providers: r.getAll(AnalyticsProviderToken),
        enabled: config.observability.analyticsEnabled && !config.observability.requireConsent,
        superProps: { brand: config.id, env: config.environment, appVersion: config.app.version },
      }),
    );

    // ── Storage ──────────────────────────────────────────────────────────────
    const namespace = config.storage.namespace ?? config.id;
    c.bind(KeyValueStoreToken).toFactory(() =>
      namespaced(adapters.keyValueStore ?? new MemoryKeyValueStore(), `${namespace}:`),
    );
    c.bind(SecureStoreToken).toFactory((r) => {
      if (!adapters.secureStore && config.environment === 'production') {
        r.get(LoggerToken).warn('No secure store adapter: secrets are held in memory only');
      }
      return namespaced(adapters.secureStore ?? new MemoryKeyValueStore(), `${namespace}.`);
    });
    if (adapters.database) c.bind(DatabaseToken).toValue(adapters.database);

    // ── i18n ─────────────────────────────────────────────────────────────────
    c.bind(I18nToken).toFactory((r) =>
      createI18n({
        defaultLocale: config.i18n.defaultLocale,
        supportedLocales: config.i18n.supportedLocales,
        ...(config.i18n.fallbackLocale ? { fallbackLocale: config.i18n.fallbackLocale } : {}),
        resources: mergeTranslations(
          frameworkTranslations,
          ...modules.map((m) => m.translations),
          brand.translations,
        ),
        onMissingKey: (key, locale) => r.get(LoggerToken).debug('i18n.missing', { key, locale }),
      }),
    );

    // ── Network ──────────────────────────────────────────────────────────────
    c.bind(HttpClientToken).toFactory((r) => {
      const i18n = r.get(I18nToken);
      const tokens = r.tryGet(AccessTokenProviderToken);
      const refresh = r.tryGet(AuthRefreshPortToken);
      const middleware: HttpMiddleware[] = [
        withHeaders(() => ({
          'Accept-Language': i18n.locale,
          'X-Brand': config.id,
          'X-App-Version': config.app.version,
          ...config.api.headers,
        })),
        tracing(r.get(TracerToken)),
        logging(r.get(LoggerToken).child({ module: 'http' })),
        retry(),
        ...(tokens ? [auth({ tokens, ...(refresh ? { refresh } : {}) })] : []),
        ...r.getAll(HttpMiddlewareToken),
      ];
      return createHttpClient({
        baseUrl: config.api.rest.baseUrl,
        timeoutMs: config.api.rest.timeoutMs,
        middleware,
        transport: adapters.httpTransport ?? createFetchTransport(),
      });
    });

    const gql = config.api.graphql;
    if (gql) {
      c.bind(GraphQLClientToken).toFactory((r) =>
        createGraphQLClient(r.get(HttpClientToken), gql.url),
      );
      if (gql.wsUrl) {
        const wsUrl = gql.wsUrl;
        c.bind(GraphQLSubscriptionClientToken).toFactory((r) => {
          const ws = new WebSocketClient({
            url: wsUrl,
            protocols: 'graphql-transport-ws',
            logger: r.get(LoggerToken).child({ module: 'gql-ws' }),
            ...(adapters.webSocketFactory ? { factory: adapters.webSocketFactory } : {}),
          });
          const tokens = r.tryGet(AccessTokenProviderToken);
          return new GraphQLSubscriptionClient(ws, async () => {
            const token = await tokens?.getAccessToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          });
        });
      }
    }

    const socket = config.api.websocket;
    if (socket) {
      c.bind(WebSocketClientToken).toFactory(
        (r) =>
          new WebSocketClient({
            url: socket.url,
            logger: r.get(LoggerToken).child({ module: 'ws' }),
            ...(adapters.webSocketFactory ? { factory: adapters.webSocketFactory } : {}),
          }),
      );
    }

    // ── AI ───────────────────────────────────────────────────────────────────
    c.bind(ToolRegistryToken).toFactory(() => new ToolRegistry());
    if (config.ai.enabled) {
      c.bind(AIClientToken).toFactory((r) =>
        withObservability(
          createHttpProxyAIClient({
            http: r.get(HttpClientToken),
            path: config.ai.path,
            ...(config.ai.streamUrl ? { streamUrl: config.ai.streamUrl } : {}),
            ...(adapters.aiStreamingFetch ? { streamingFetch: adapters.aiStreamingFetch } : {}),
            streamHeaders: () => bearerHeader(r),
          }),
          {
            tracer: r.get(TracerToken),
            analytics: r.get(AnalyticsToken),
            logger: r.get(LoggerToken).child({ module: 'ai' }),
          },
        ),
      );
    }
  });
}

async function bearerHeader(r: Resolver): Promise<Record<string, string>> {
  const token = await r.tryGet(AccessTokenProviderToken)?.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
