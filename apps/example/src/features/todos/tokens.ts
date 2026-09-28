import { createToken } from '@org/di';
import type { TodoRepository } from './domain/TodoRepository';
import type { AddTodo, GetTodos, ToggleTodo } from './domain/usecases';

export const TodoRepositoryToken = createToken<TodoRepository>('todos.Repository');
export const GetTodosToken = createToken<GetTodos>('todos.GetTodos');
export const AddTodoToken = createToken<AddTodo>('todos.AddTodo');
export const ToggleTodoToken = createToken<ToggleTodo>('todos.ToggleTodo');
