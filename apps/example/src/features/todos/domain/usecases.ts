import type { AppError, Result } from '@org/foundation';
import { validateTitle, type Todo, type TodoId } from './Todo';
import type { TodoRepository } from './TodoRepository';

/** Use cases: one public `execute`, depend only on ports. Shared by UI view models and AI tools. */
export class GetTodos {
  constructor(private readonly repo: TodoRepository) {}
  async execute(
    filter: 'all' | 'open' | 'done' = 'all',
  ): Promise<Result<readonly Todo[], AppError>> {
    const res = await this.repo.list();
    if (!res.ok || filter === 'all') return res;
    return {
      ok: true,
      value: res.value.filter((t) => (filter === 'done' ? t.completed : !t.completed)),
    };
  }
}

export class AddTodo {
  constructor(private readonly repo: TodoRepository) {}
  async execute(rawTitle: string): Promise<Result<Todo, AppError>> {
    const title = validateTitle(rawTitle);
    return title.ok ? this.repo.add(title.value) : title;
  }
}

export class ToggleTodo {
  constructor(private readonly repo: TodoRepository) {}
  execute(id: TodoId, completed: boolean): Promise<Result<Todo, AppError>> {
    return this.repo.setCompleted(id, completed);
  }
}
