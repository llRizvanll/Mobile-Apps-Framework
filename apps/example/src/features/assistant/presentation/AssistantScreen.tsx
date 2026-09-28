import { useRef } from 'react';
import { Alert, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AIClientToken, ToolRegistryToken, type ToolCallPart } from '@org/ai';
import { useBrandConfig, useResolver } from '@org/core';
import { useTranslation } from '@org/i18n';
import { useMvi, useMviEffects } from '@org/presentation';
import { Box, Button, Input, Screen, Spinner, Text } from '@org/ui';
import type { AssistantResources } from '../translations';
import { createAssistantStore, type Bubble } from './assistantStore';

export function AssistantScreen() {
  const r = useResolver();
  const config = useBrandConfig();
  const { t, i18n } = useTranslation<AssistantResources>();
  const insets = useSafeAreaInsets();
  const list = useRef<FlatList<Bubble>>(null);

  const confirm = (call: ToolCallPart) =>
    new Promise<boolean>((resolve) =>
      Alert.alert(t('assistant.confirm.title'), `${call.name}\n${JSON.stringify(call.input)}`, [
        { text: i18n.t('framework.action.cancel'), style: 'cancel', onPress: () => resolve(false) },
        { text: t('assistant.confirm.allow'), onPress: () => resolve(true) },
      ]),
    );

  const [state, dispatch, store] = useMvi(() =>
    createAssistantStore({
      client: r.get(AIClientToken),
      tools: r.get(ToolRegistryToken),
      model: config.ai.defaultModel,
      system: `You are the in-app assistant for ${config.displayName}. Reply in locale "${i18n.locale}". Use tools to act on the user's tasks.`,
      confirm,
    }),
  );
  useMviEffects(store, (e) => {
    if (e.type === 'scrollToEnd')
      requestAnimationFrame(() => list.current?.scrollToEnd({ animated: true }));
  });

  return (
    <Screen
      insets={insets}
      padding="none"
      footer={
        <Box row gap="sm" align="center">
          <Box flex={1}>
            <Input
              value={state.input}
              onChangeText={(text) => dispatch({ type: 'inputChanged', text })}
              placeholder={t('assistant.placeholder')}
              onSubmitEditing={() => dispatch({ type: 'send' })}
              testID="assistant.input"
            />
          </Box>
          <Button
            title={t('assistant.send')}
            onPress={() => dispatch({ type: 'send' })}
            disabled={state.status === 'thinking'}
          />
        </Box>
      }
    >
      <FlatList
        ref={list}
        data={state.bubbles}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListHeaderComponent={<Text variant="headline">{t('assistant.title')}</Text>}
        ListFooterComponent={
          state.status === 'thinking' ? (
            <Spinner />
          ) : state.status === 'error' ? (
            <Text color="danger">{t('assistant.error')}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Box
            padding="md"
            radius="lg"
            background={item.from === 'user' ? 'primaryContainer' : 'surfaceVariant'}
            style={{ alignSelf: item.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}
          >
            <Text color={item.from === 'user' ? 'onPrimaryContainer' : 'onSurface'}>
              {item.text}
            </Text>
          </Box>
        )}
      />
    </Screen>
  );
}
