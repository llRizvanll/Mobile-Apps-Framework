import { AppError } from '@framework/foundation';
import { createAnalytics, MemoryAnalyticsProvider } from '@framework/observability';
import { AddTodo, GetTodos, ToggleTodo } from '../domain/usecases';
import { TodoListViewModel } from '../presentation/TodoListViewModel';
import { FakeTodoRepository } from './domain.test';

const tick = () => new Promise((r) => setTimeout(() => r(undefined), 0));

const setup = () => {
  const repo = new FakeTodoRepository();
  const events = new MemoryAnalyticsProvider();
  const vm = new TodoListViewModel(
    new GetTodos(repo),
    new AddTodo(repo),
    new ToggleTodo(repo),
    createAnalytics({ providers: [events] }),
  );
  return { repo, vm, events };
};

describe('TodoListViewModel', () => {
  it('loads on init and adds todos', async () => {
    const { vm, events } = setup();
    vm.attach();
    await tick();
    expect(vm.state.items).toHaveLength(2);
    expect(vm.remaining).toBe(1);
    vm.setDraft('Write docs');
    await vm.add();
    expect(vm.state.items[0]?.title).toBe('Write docs');
    expect(vm.state.draft).toBe('');
    expect(events.events).toContainEqual({
      type: 'track',
      name: 'todo_added',
      props: { length: 10 },
    });
  });

  it('surfaces validation errors as i18n keys', async () => {
    const { vm } = setup();
    await vm.add();
    expect(vm.state.errorKey).toBe('todos.errors.titleRequired');
  });

  it('rolls back optimistic toggles on failure', async () => {
    const { vm, repo } = setup();
    vm.attach();
    await tick();
    const first = vm.state.items[0]!;
    repo.fail = new AppError('network', 'offline', { retryable: true });
    const pending = vm.toggle(first);
    expect(vm.state.items[0]?.completed).toBe(true);
    await pending;
    expect(vm.state.items[0]?.completed).toBe(false);
    expect(vm.state.errorKey).toBe('todos.errors.generic');
  });
});
