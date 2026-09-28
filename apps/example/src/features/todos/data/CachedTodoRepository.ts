import { ok } from '@org/foundation';
import { typedEntry, type KeyValueStore } from '@org/storage';
import type { Todo, TodoId } from '../domain/Todo';
import type { TodoRepository } from '../domain/TodoRepository';

interface CachedTodo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

/**
 * Decorator adding offline read-through caching to any TodoRepository: successful lists are
 * cached; on retryable failures (offline, timeout, 5xx) the last good list is served instead.
 */
export class CachedTodoRepository implements TodoRepository {
  private readonly cache;

  constructor(
    private readonly inner: TodoRepository,
    storage: KeyValueStore,
  ) {
    this.cache = typedEntry<CachedTodo[]>(storage, 'todos.cache.v1');
  }

  async list() {
    const res = await this.inner.list();
    if (res.ok) {
      await this.cache.set(res.value.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })));
      return res;
    }
    const cached = res.error.retryable ? await this.cache.get() : undefined;
    return cached
      ? ok(
          cached.map((c): Todo => ({ ...c, id: c.id as TodoId, createdAt: new Date(c.createdAt) })),
        )
      : res;
  }

  add(title: string) {
    return this.inner.add(title);
  }

  setCompleted(id: TodoId, completed: boolean) {
    return this.inner.setCompleted(id, completed);
  }
}
