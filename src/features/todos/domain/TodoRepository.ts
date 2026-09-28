import type { AppError, Result } from '@framework/foundation';
import type { Todo, TodoId } from './Todo';

/** Port — implemented in data/. The domain never knows about HTTP, caches or storage. */
export interface TodoRepository {
  list(): Promise<Result<readonly Todo[], AppError>>;
  add(title: string): Promise<Result<Todo, AppError>>;
  setCompleted(id: TodoId, completed: boolean): Promise<Result<Todo, AppError>>;
}
