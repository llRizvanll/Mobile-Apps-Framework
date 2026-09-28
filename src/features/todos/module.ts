import { flag } from '@config/featureFlags';
import { defineModule } from '@framework/core';
import { HttpClientToken } from '@framework/network';
import { KeyValueStoreToken } from '@framework/storage';
import { todoTools } from './ai/tools';
import { CachedTodoRepository } from './data/CachedTodoRepository';
import { RestTodoRepository } from './data/RestTodoRepository';
import { AddTodo, GetTodos, ToggleTodo } from './domain/usecases';
import { TodoListScreen } from './presentation/TodoListScreen';
import { AddTodoToken, GetTodosToken, TodoRepositoryToken, ToggleTodoToken } from './tokens';
import { ar, en } from './translations';

/** Feature module: the only file the app composition root needs to know about. */
export const todosModule = defineModule({
  id: 'todos',
  featureFlag: flag('todos'),
  register(c) {
    c.bind(TodoRepositoryToken).toFactory(
      (r) =>
        new CachedTodoRepository(
          new RestTodoRepository(r.get(HttpClientToken)),
          r.get(KeyValueStoreToken),
        ),
    );
    c.bind(GetTodosToken).toClass(GetTodos, [TodoRepositoryToken] as const);
    c.bind(AddTodoToken).toClass(AddTodo, [TodoRepositoryToken] as const);
    c.bind(ToggleTodoToken).toClass(ToggleTodo, [TodoRepositoryToken] as const);
  },
  translations: { en, ar },
  tools: todoTools,
  tabs: [{ key: 'todos', titleKey: 'todos.tab', component: TodoListScreen, order: 10 }],
});
