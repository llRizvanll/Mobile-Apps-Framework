import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { fetch as expoFetch } from 'expo/fetch';
import { DevSettings, I18nManager } from 'react-native';
import type { StreamingFetch } from '@org/ai';
import type { PlatformAdapters } from '@org/core';
import { MemorySink } from '@org/observability';
import { MemoryKeyValueStore, createAsyncStorageStore, createExpoSecureStore } from '@org/storage';
import { createMockBackend } from './mockBackend';

/** In-memory ring buffer of recent logs — surfaced by an in-app debug screen / bug reports. */
export const debugLogSink = new MemorySink(300);

/**
 * The ONLY place native modules are touched. Swap vendors here (MMKV instead of AsyncStorage,
 * Sentry for crashes, Segment for analytics) without changing any feature code.
 */
export function createPlatformAdapters(options: { mockApi: boolean }): PlatformAdapters {
  const keyValueStore = createAsyncStorageStore(AsyncStorage);
  return {
    keyValueStore,
    secureStore: createExpoSecureStore(SecureStore, keyValueStore),
    deviceLocales: () => getLocales().map((l) => l.languageTag),
    layoutDirection: {
      get isRTL() {
        return I18nManager.isRTL;
      },
      allowRTL: (allow) => I18nManager.allowRTL(allow),
      forceRTL: (force) => I18nManager.forceRTL(force),
      requestReload: () => DevSettings.reload(),
    },
    aiStreamingFetch: expoFetch satisfies StreamingFetch,
    logSinks: [debugLogSink],
    // crashReporter: createSentryReporter(Sentry), analyticsProviders: [segmentProvider(client)], ...
    ...(options.mockApi ? { httpTransport: createMockBackend() } : {}),
  };
}

/** Adapters for Jest / Storybook — no native modules. */
export const inMemoryAdapters = (): PlatformAdapters => ({
  keyValueStore: new MemoryKeyValueStore(),
  secureStore: new MemoryKeyValueStore(),
});
