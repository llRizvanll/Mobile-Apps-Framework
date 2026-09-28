import { z } from 'zod';
import type { Todo, TodoId } from '../domain/Todo';

/** Wire format — validated at the boundary so bad payloads never reach the domain. */
export const todoDtoSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  completed: z.boolean(),
  created_at: z.string(),
});
export const todoListDtoSchema = z.object({ items: z.array(todoDtoSchema) });

export type TodoDto = z.input<typeof todoDtoSchema>;

export const toDomain = (dto: z.output<typeof todoDtoSchema>): Todo => ({
  id: dto.id as TodoId,
  title: dto.title,
  completed: dto.completed,
  createdAt: new Date(dto.created_at),
});
