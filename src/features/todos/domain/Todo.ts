import { AppError, err, ok, type Branded, type Result } from '@framework/foundation';

export type TodoId = Branded<string, 'TodoId'>;

export interface Todo {
  readonly id: TodoId;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: Date;
}

export const TODO_TITLE_MAX = 120;

/** Domain rule: titles are trimmed, non-empty and bounded. */
export function validateTitle(raw: string): Result<string, AppError> {
  const title = raw.trim();
  if (!title)
    return err(
      new AppError('validation', 'Title is required', {
        userMessageKey: 'todos.errors.titleRequired',
      }),
    );
  if (title.length > TODO_TITLE_MAX) {
    return err(
      new AppError('validation', 'Title too long', {
        userMessageKey: 'todos.errors.titleTooLong',
        meta: { max: TODO_TITLE_MAX },
      }),
    );
  }
  return ok(title);
}
