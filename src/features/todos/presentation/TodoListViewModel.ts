import type { AppError } from '@framework/foundation';
import type { Analytics } from '@framework/observability';
import { ViewModel } from '@framework/presentation';
import type { Todo } from '../domain/Todo';
import type { AddTodo, GetTodos, ToggleTodo } from '../domain/usecases';

export interface TodoListState {
  readonly items: readonly Todo[];
  readonly loading: boolean;
  readonly draft: string;
  readonly adding: boolean;
  /** i18n key for the current error, if any. */
  readonly errorKey: string | null;
}

/** MVVM: owns screen state; commands are methods; React-free and unit-testable. */
export class TodoListViewModel extends ViewModel<TodoListState> {
  constructor(
    private readonly getTodos: GetTodos,
    private readonly addTodo: AddTodo,
    private readonly toggleTodo: ToggleTodo,
    private readonly analytics: Analytics,
  ) {
    super({ items: [], loading: false, draft: '', adding: false, errorKey: null });
  }

  protected override onInit(): Promise<void> {
    return this.refresh();
  }

  protected override onError(error: AppError): void {
    this.setState({
      loading: false,
      adding: false,
      errorKey: error.userMessageKey ?? 'todos.errors.generic',
    });
  }

  readonly refresh = async (): Promise<void> => {
    this.setState({ loading: true, errorKey: null });
    const res = await this.getTodos.execute();
    if (res.ok) this.setState({ items: res.value, loading: false });
    else this.onError(res.error);
  };

  readonly setDraft = (draft: string): void => this.setState({ draft, errorKey: null });

  readonly add = async (): Promise<void> => {
    if (this.state.adding) return;
    this.setState({ adding: true, errorKey: null });
    const res = await this.addTodo.execute(this.state.draft);
    if (!res.ok) return this.onError(res.error);
    this.setState((s) => ({ items: [res.value, ...s.items], draft: '', adding: false }));
    this.analytics.track('todo_added', { length: res.value.title.length });
  };

  /** Optimistic update with rollback on failure. */
  readonly toggle = async (todo: Todo): Promise<void> => {
    const flip = (completed: boolean) =>
      this.setState((s) => ({
        items: s.items.map((t) => (t.id === todo.id ? { ...t, completed } : t)),
      }));
    flip(!todo.completed);
    const res = await this.toggleTodo.execute(todo.id, !todo.completed);
    if (!res.ok) {
      flip(todo.completed);
      this.onError(res.error);
    }
  };

  get remaining(): number {
    return this.state.items.filter((t) => !t.completed).length;
  }
}
