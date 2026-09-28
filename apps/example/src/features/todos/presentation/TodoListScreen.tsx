import { FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolver } from '@org/core';
import { useTranslation } from '@org/i18n';
import { AnalyticsToken } from '@org/observability';
import { useViewModel } from '@org/presentation';
import { Box, Button, Divider, EmptyState, FormField, ListItem, Screen, Text } from '@org/ui';
import { AddTodoToken, GetTodosToken, ToggleTodoToken } from '../tokens';
import type { TodosResources } from '../translations';
import { TodoListViewModel } from './TodoListViewModel';

export function TodoListScreen() {
  const r = useResolver();
  const [state, vm] = useViewModel(
    () =>
      new TodoListViewModel(
        r.get(GetTodosToken),
        r.get(AddTodoToken),
        r.get(ToggleTodoToken),
        r.get(AnalyticsToken),
      ),
  );
  const { t } = useTranslation<TodosResources>();
  const insets = useSafeAreaInsets();

  return (
    <Screen insets={insets} padding="none" testID="todos.screen">
      <Box padding="lg" gap="md">
        <Text variant="headline" accessibilityRole="header">
          {t('todos.title')}
        </Text>
        <Text color="onSurfaceMuted">{t('todos.remaining', { count: vm.remaining })}</Text>
        <Box row gap="sm" align="flex-start">
          <Box flex={1}>
            <FormField
              value={state.draft}
              onChangeText={vm.setDraft}
              placeholder={t('todos.placeholder')}
              onSubmitEditing={() => void vm.add()}
              returnKeyType="done"
              error={state.errorKey ? t(state.errorKey as 'todos.errors.generic') : null}
              testID="todos.input"
            />
          </Box>
          <Button
            title={t('todos.add')}
            onPress={() => void vm.add()}
            loading={state.adding}
            testID="todos.add"
          />
        </Box>
      </Box>
      <FlatList
        data={state.items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={state.loading} onRefresh={() => void vm.refresh()} />
        }
        ItemSeparatorComponent={Divider}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          state.loading ? null : (
            <EmptyState title={t('todos.empty.title')} message={t('todos.empty.message')} />
          )
        }
        renderItem={({ item }) => (
          <ListItem
            title={item.title}
            onPress={() => void vm.toggle(item)}
            left={
              <Text variant="title" color={item.completed ? 'success' : 'onSurfaceMuted'}>
                {item.completed ? '✓' : '○'}
              </Text>
            }
            testID={`todos.item.${item.id}`}
          />
        )}
      />
    </Screen>
  );
}
