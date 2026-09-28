import { useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FrameworkProvider, useFeatureFlag } from '@org/core';
import { Box, Button } from '@org/ui';
import { createPlatformAdapters } from './bootstrap/adapters';
import { createApplication } from './bootstrap/createApplication';
import { AssistantScreen } from './features/assistant/presentation/AssistantScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { TodoListScreen } from './features/todos/presentation/TodoListScreen';

// Literal `process.env.EXPO_PUBLIC_*` access is required: Expo inlines these at build time.
const env = {
  brand: process.env.EXPO_PUBLIC_BRAND as string | undefined,
  environment: process.env.EXPO_PUBLIC_ENV as string | undefined,
  apiMode: (process.env.EXPO_PUBLIC_API_MODE as string | undefined) ?? 'mock',
};

export default function App() {
  const [app] = useState(() =>
    createApplication(env, createPlatformAdapters({ mockApi: env.apiMode === 'mock' })),
  );
  return (
    <SafeAreaProvider>
      <FrameworkProvider app={app}>
        <Shell />
      </FrameworkProvider>
    </SafeAreaProvider>
  );
}

type Tab = 'todos' | 'assistant' | 'settings';

/** Minimal tab shell. Swap for expo-router / React Navigation in a real app. */
function Shell() {
  const [tab, setTab] = useState<Tab>('todos');
  const assistantEnabled = useFeatureFlag('assistant');
  const insets = useSafeAreaInsets();
  const tabs: Tab[] = assistantEnabled ? ['todos', 'assistant', 'settings'] : ['todos', 'settings'];
  return (
    <Box flex={1} background="background">
      <Box flex={1}>
        {tab === 'todos' ? (
          <TodoListScreen />
        ) : tab === 'assistant' ? (
          <AssistantScreen />
        ) : (
          <SettingsScreen />
        )}
      </Box>
      <Box
        row
        justify="space-around"
        paddingY="sm"
        background="surface"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        {tabs.map((t) => (
          <Button
            key={t}
            title={t}
            size="sm"
            variant={tab === t ? 'secondary' : 'ghost'}
            onPress={() => setTab(t)}
            accessibilityState={{ selected: tab === t }}
          />
        ))}
      </Box>
    </Box>
  );
}
