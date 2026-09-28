import { mapResult } from '@framework/foundation';
import type { HttpClient } from '@framework/network';
import type { TodoRepository } from '../domain/TodoRepository';
import { toDomain, todoDtoSchema, todoListDtoSchema } from './dto';

export class RestTodoRepository implements TodoRepository {
  constructor(private readonly http: HttpClient) {}

  async list() {
    const res = await this.http.get('/todos', {
      parser: todoListDtoSchema,
      meta: { operation: 'todos.list' },
    });
    return mapResult(res, (r) => r.data.items.map(toDomain));
  }

  async add(title: string) {
    const res = await this.http.post(
      '/todos',
      { title },
      { parser: todoDtoSchema, meta: { operation: 'todos.add' } },
    );
    return mapResult(res, (r) => toDomain(r.data));
  }

  async setCompleted(id: string, completed: boolean) {
    const res = await this.http.patch(
      `/todos/${encodeURIComponent(id)}`,
      { completed },
      { parser: todoDtoSchema, meta: { operation: 'todos.update' } },
    );
    return mapResult(res, (r) => toDomain(r.data));
  }
}
