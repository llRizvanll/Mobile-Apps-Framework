import { AIToolToken, ToolRegistryToken } from '@org/ai';
import { Container } from '@org/di';
import { AppError, Emitter, type Unsubscribe } from '@org/foundation';
import { I18nToken, matchLocale, syncLayoutDirection } from '@org/i18n';
import {
  AnalyticsToken,
  CrashReporterToken,
  LoggerToken,
  TracerToken,
  installGlobalErrorHandlers,
} from '@org/observability';
import {
  AppStoreToken,
  appSlice,
  createAppStore,
  createPersistence,
  sessionSlice,
  settingsSlice,
  type AppStore,
} from '@org/state';
import { KeyValueStoreToken } from '@org/storage';
import type { PlatformAdapters } from './adapters';
import { resolveBrandConfig, type BrandDefinition } from './config/brand';
import type { BrandConfig, Environment } from './config/schema';
import { resolveModules, type FrameworkModule, type ModuleContext } from './module';
import { frameworkServices } from './services';
import { FeatureFlagsToken } from './tokens';

export interface CreateAppOptions {
  readonly brand: BrandDefinition;
  readonly environment: Environment;
  readonly modules?: readonly FrameworkModule[];
  readonly adapters?: PlatformAdapters;
  /** Final say over DI bindings — test doubles, debug tooling. Applied after all modules. */
  readonly overrides?: (container: Container) => void;
  readonly devTools?: boolean;
}

export type AppLifecycleEvent =
  | { type: 'starting' }
  | { type: 'started'; durationMs: number }
  | { type: 'failed'; error: AppError }
  | { type: 'stopped' };

export interface FrameworkApp {
  readonly config: BrandConfig;
  readonly brand: BrandDefinition;
  readonly container: Container;
  readonly store: AppStore;
  readonly modules: readonly FrameworkModule[];
  /** Idempotent: concurrent/repeated calls share one boot. */
  start(): Promise<void>;
  stop(): Promise<void>;
  onLifecycle(listener: (event: AppLifecycleEvent) => void): Unsubscribe;
}

/**
 * Composition root. Synchronous part: validate config → build container → create store.
 * `start()` performs async boot: rehydrate → locale → feature flags → AI tools → module onStart.
 */
export function createApp(options: CreateAppOptions): FrameworkApp {
  const { brand, environment, adapters = {} } = options;
  const config = resolveBrandConfig(brand, environment);
  const modules = resolveModules(
    [...(options.modules ?? []), ...(brand.modules ?? [])],
    config.features,
  );

  const container = new Container();
  container.load(frameworkServices(config, brand, adapters, modules));
  for (const m of modules) m.register?.(container, config);
  options.overrides?.(container);

  const persistence = createPersistence({
    storage: container.get(KeyValueStoreToken),
    key: config.storage.persistKey,
    whitelist: ['settings', 'session'],
  });
  const reducers = Object.assign({}, ...modules.map((m) => m.reducers ?? {})) as Record<
    string,
    never
  >;
  const store = createAppStore({
    resolver: container,
    reducers,
    persistence,
    devTools: options.devTools ?? environment !== 'production',
  });
  container.bind(AppStoreToken).toValue(store);

  const events = new Emitter<{ lifecycle: AppLifecycleEvent }>();
  const cleanups: Unsubscribe[] = [];
  let booting: Promise<void> | undefined;
  let stopping: Promise<void> | undefined;

  const context = (): ModuleContext => ({
    resolver: container,
    config,
    store,
    logger: container.get(LoggerToken),
  });

  const wireShellEffects = (): void => {
    const analytics = container.get(AnalyticsToken);
    const crash = container.get(CrashReporterToken);
    const i18n = container.get(I18nToken);
    const { listener } = store;
    cleanups.push(
      listener.startListening({
        actionCreator: settingsSlice.actions.localeChanged,
        effect: async ({ payload }) => {
          const next =
            payload ??
            matchLocale(
              adapters.deviceLocales?.() ?? [],
              config.i18n.supportedLocales,
              config.i18n.defaultLocale,
            );
          await i18n.setLocale(next);
          if (adapters.layoutDirection) syncLayoutDirection(adapters.layoutDirection, next);
        },
      }),
      listener.startListening({
        actionCreator: settingsSlice.actions.analyticsConsentChanged,
        effect: ({ payload }) =>
          analytics.setEnabled(payload && config.observability.analyticsEnabled),
      }),
      listener.startListening({
        actionCreator: sessionSlice.actions.signedIn,
        effect: ({ payload }) => {
          crash.setUser({ id: payload.userId });
          analytics.identify(payload.userId);
        },
      }),
      listener.startListening({
        actionCreator: sessionSlice.actions.signedOut,
        effect: () => {
          crash.setUser(null);
          analytics.reset();
        },
      }),
    );
  };

  const boot = async (): Promise<void> => {
    const started = Date.now();
    events.emit('lifecycle', { type: 'starting' });
    const tracer = container.get(TracerToken);
    const logger = container.get(LoggerToken);
    const root = tracer.startSpan('app.start', {
      attributes: { brand: config.id, env: environment },
    });
    try {
      const crash = container.get(CrashReporterToken);
      crash.setTag('brand', config.id);
      crash.setTag('environment', environment);
      cleanups.push(installGlobalErrorHandlers(crash));

      const step = async (name: string, fn: () => unknown): Promise<void> => {
        const span = tracer.startSpan(`app.start.${name}`, { parent: root });
        try {
          await fn();
          span.end('ok');
        } catch (e) {
          span.end('error');
          throw e;
        }
      };

      await step('rehydrate', async () => store.dispatch(await persistence.restore()));
      await step('locale', async () => {
        const settings = store.getState().settings;
        const i18n = container.get(I18nToken);
        const locale =
          settings.locale && config.i18n.supportedLocales.includes(settings.locale)
            ? settings.locale
            : matchLocale(
                adapters.deviceLocales?.() ?? [],
                config.i18n.supportedLocales,
                config.i18n.defaultLocale,
              );
        await i18n.setLocale(locale);
        if (adapters.layoutDirection) syncLayoutDirection(adapters.layoutDirection, locale);
      });
      await step('flags', () =>
        container
          .get(FeatureFlagsToken)
          .refresh()
          .catch((e: unknown) => logger.warn('flags.refresh.failed', { error: String(e) })),
      );
      await step('consent', () => {
        const consent = store.getState().settings.analyticsConsent;
        if (consent !== null)
          container
            .get(AnalyticsToken)
            .setEnabled(consent && config.observability.analyticsEnabled);
      });
      await step('ai-tools', () => {
        const registry = container.get(ToolRegistryToken);
        registry.register(...container.getAll(AIToolToken));
        for (const m of modules) if (m.tools) registry.register(...m.tools(container));
      });
      wireShellEffects();
      for (const m of modules)
        if (m.onStart) await step(`module.${m.id}`, () => m.onStart?.(context()));

      store.dispatch(appSlice.actions.bootSucceeded());
      root.end('ok');
      const durationMs = Date.now() - started;
      logger.info('app.started', { ms: durationMs, modules: modules.map((m) => m.id).join(',') });
      events.emit('lifecycle', { type: 'started', durationMs });
    } catch (thrown) {
      const error = AppError.from(thrown);
      root.end('error');
      logger.error('app.start.failed', error);
      store.dispatch(appSlice.actions.bootFailed(error.message));
      events.emit('lifecycle', { type: 'failed', error });
      booting = undefined; // allow retry
      throw error;
    }
  };

  return {
    config,
    brand,
    container,
    store,
    modules,
    start: () => (booting ??= boot()),
    /** Idempotent: flushes persistence, runs module onStop (reverse order), disposes the container. */
    stop: () =>
      (stopping ??= (async () => {
        for (const m of [...modules].reverse()) await m.onStop?.(context());
        for (const c of cleanups.splice(0)) c();
        await persistence.flush(store.getState() as unknown as Record<string, unknown>);
        await container.dispose();
        events.emit('lifecycle', { type: 'stopped' });
      })()),
    onLifecycle: (l) => events.on('lifecycle', l),
  };
}
