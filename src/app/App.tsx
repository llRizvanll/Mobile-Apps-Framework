import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FrameworkProvider, type FrameworkApp } from '@framework/core';
import { AppShell } from './AppShell';
import { createPlatformAdapters } from './bootstrap/adapters';
import { bootstrapApplication } from './bootstrap/bootstrapApplication';
import { appEnv } from './env';

type BootState = { app: FrameworkApp } | { error: Error } | null;

/**
 * Entry component. Bootstrapping is async (it reads persisted feature-flag overrides before modules
 * are composed); FrameworkProvider then runs the traced boot sequence and shows its own splash.
 */
export default function App() {
  const [state, setState] = useState<BootState>(null);

  useEffect(() => {
    bootstrapApplication(
      appEnv,
      createPlatformAdapters({ mockApi: appEnv.apiMode === 'mock' }),
    ).then(
      (app) => setState({ app }),
      (error: unknown) =>
        setState({ error: error instanceof Error ? error : new Error(String(error)) }),
    );
  }, []);

  if (state === null) return <View style={styles.blank} />;
  if ('error' in state) return <ConfigError error={state.error} />;

  return (
    <SafeAreaProvider>
      <FrameworkProvider app={state.app}>
        <AppShell />
      </FrameworkProvider>
    </SafeAreaProvider>
  );
}

/** Shown when composition fails (invalid brand config, unknown brand, flag registry errors). */
function ConfigError({ error }: { readonly error: Error }) {
  return (
    <View style={[styles.blank, styles.center]} accessibilityRole="alert">
      <Text style={styles.title}>App configuration error</Text>
      <Text style={styles.body}>{error.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#1B1B1F' },
  body: { fontSize: 14, color: '#5E5E6A' },
});
