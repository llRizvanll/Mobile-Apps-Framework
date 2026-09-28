import { defineModule } from '@org/core';
import { HttpClientToken } from '@org/network';
import { KeyValueStoreToken } from '@org/storage';
import { todoTools } from './ai/tools';
import { CachedTodoRepository } from './data/CachedTodoRepository';
import { RestTodoRepository } from './data/RestTodoRepository';
import { AddTodo, GetTodos, ToggleTodo } from './domain/usecases';
import { AddTodoToken, GetTodosToken, TodoRepositoryToken, ToggleTodoToken } from './tokens';
import { ar, en, fr } from './translations';

/** Feature module: the only file the app composition root needs to know about. */
export const todosModule = defineModule({
  id: 'todos',
  featureFlag: 'todos',
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
  translations: { en, ar, fr },
  tools: todoTools,
});
