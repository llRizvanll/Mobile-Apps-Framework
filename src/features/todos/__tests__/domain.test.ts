import { type AppError, err, ok } from '@framework/foundation';
import type { Todo, TodoId } from '../domain/Todo';
import type { TodoRepository } from '../domain/TodoRepository';
import { AddTodo, GetTodos } from '../domain/usecases';

export const todo = (id: string, completed = false): Todo => ({
  id: id as TodoId,
  title: `Task ${id}`,
  completed,
  createdAt: new Date(0),
});

export class FakeTodoRepository implements TodoRepository {
  items: Todo[] = [todo('1'), todo('2', true)];
  fail: AppError | null = null;
  list = jest.fn(() => Promise.resolve(this.fail ? err(this.fail) : ok(this.items)));
  add = jest.fn((title: string) =>
    Promise.resolve(this.fail ? err(this.fail) : ok({ ...todo('new'), title })),
  );
  setCompleted = jest.fn((id: TodoId, completed: boolean) =>
    Promise.resolve(this.fail ? err(this.fail) : ok({ ...todo(id), completed })),
  );
}

describe('todos domain', () => {
  it('filters todos', async () => {
    const get = new GetTodos(new FakeTodoRepository());
    const open = await get.execute('open');
    expect(open.ok && open.value.map((t) => t.id)).toEqual(['1']);
  });

  it('validates titles before touching the repository', async () => {
    const repo = new FakeTodoRepository();
    const add = new AddTodo(repo);
    const blank = await add.execute('   ');
    expect(!blank.ok && blank.error.userMessageKey).toBe('todos.errors.titleRequired');
    expect(!(await add.execute('x'.repeat(121))).ok).toBe(true);
    expect(repo.add).not.toHaveBeenCalled();
    const good = await add.execute('  Buy milk ');
    expect(good.ok && good.value.title).toBe('Buy milk');
  });
});
