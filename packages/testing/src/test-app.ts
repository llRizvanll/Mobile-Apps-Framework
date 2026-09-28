import type { Container } from '@org/di';
import { deepMerge, type DeepPartial } from '@org/foundation';
import {
  MemoryAnalyticsProvider,
  MemorySink,
  MemorySpanExporter,
  type CrashReporter,
} from '@org/observability';
import { MemoryKeyValueStore } from '@org/storage';
import {
  createApp,
  defineBrand,
  type BrandDefinition,
  type Environment,
  type FrameworkApp,
  type FrameworkModule,
  type PlatformAdapters,
} from '@org/core';
import { MockTransport } from './mock-transport';

export const testBrandConfig: BrandDefinition['config'] = {
  id: 'test-brand',
  displayName: 'Test Brand',
  app: { bundleId: 'com.example.test', scheme: 'testbrand', version: '1.0.0' },
  api: { rest: { baseUrl: 'https://api.test.local' } },
  i18n: { defaultLocale: 'en', supportedLocales: ['en', 'ar'] },
  features: {},
  observability: { logLevel: 'debug' },
};

export const createTestBrand = (overrides: DeepPartial<BrandDefinition> = {}): BrandDefinition =>
  defineBrand(deepMerge<BrandDefinition>({ config: testBrandConfig }, overrides));

export class RecordingCrashReporter implements CrashReporter {
  readonly exceptions: unknown[] = [];
  readonly breadcrumbs: string[] = [];
  user: { id: string } | null = null;
  readonly tags: Record<string, string> = {};
  captureException(e: unknown): void {
    this.exceptions.push(e);
  }
  captureMessage(): void {}
  addBreadcrumb(b: { message: string }): void {
    this.breadcrumbs.push(b.message);
  }
  setUser(u: { id: string } | null): void {
    this.user = u;
  }
  setTag(k: string, v: string): void {
    this.tags[k] = v;
  }
}

const liveApps = new Set<FrameworkApp>();

/** Stops every app created by `createTestApp` (clears persistence timers, disposes containers). */
export async function cleanupTestApps(): Promise<void> {
  const apps = [...liveApps];
  liveApps.clear();
  await Promise.all(apps.map((a) => a.stop()));
}

// Auto-cleanup when running under Jest (same approach as RNTL's auto-cleanup).
if (typeof afterEach === 'function') afterEach(cleanupTestApps);

export interface TestAppOptions {
  readonly brand?: BrandDefinition;
  readonly environment?: Environment;
  readonly modules?: readonly FrameworkModule[];
  readonly adapters?: PlatformAdapters;
  readonly overrides?: (container: Container) => void;
  /** Skip `start()` (to assert boot behaviour yourself). */
  readonly manualStart?: boolean;
  /** Stub HTTP routes before the app boots (modules may fetch during start/mount). */
  readonly mockHttp?: (http: MockTransport) => void;
}

export interface TestApp {
  readonly app: FrameworkApp;
  readonly http: MockTransport;
  readonly storage: MemoryKeyValueStore;
  readonly secureStorage: MemoryKeyValueStore;
  readonly analytics: MemoryAnalyticsProvider;
  readonly logs: MemorySink;
  readonly spans: MemorySpanExporter;
  readonly crash: RecordingCrashReporter;
}

/** A fully wired app with observable in-memory doubles for every platform adapter. */
export async function createTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const http = new MockTransport();
  options.mockHttp?.(http);
  const storage = new MemoryKeyValueStore();
  const secureStorage = new MemoryKeyValueStore();
  const analytics = new MemoryAnalyticsProvider();
  const logs = new MemorySink();
  const spans = new MemorySpanExporter();
  const crash = new RecordingCrashReporter();
  const app = createApp({
    brand: options.brand ?? createTestBrand(),
    environment: options.environment ?? 'development',
    devTools: false,
    ...(options.modules ? { modules: options.modules } : {}),
    ...(options.overrides ? { overrides: options.overrides } : {}),
    adapters: {
      httpTransport: http.transport,
      keyValueStore: storage,
      secureStore: secureStorage,
      analyticsProviders: [analytics],
      logSinks: [logs],
      spanExporters: [spans],
      crashReporter: crash,
      deviceLocales: () => ['en-US'],
      ...options.adapters,
    },
  });
  liveApps.add(app);
  if (!options.manualStart) await app.start();
  return { app, http, storage, secureStorage, analytics, logs, spans, crash };
}
