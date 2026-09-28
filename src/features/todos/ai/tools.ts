import { defineTool } from '@framework/ai';
import type { Resolver } from '@framework/di';
import { z } from 'zod';
import { AddTodoToken, GetTodosToken } from '../tokens';

/**
 * AI capabilities of the todos feature. They call the *same use cases* as the UI, so business
 * rules (validation, analytics, caching) apply identically to humans and agents.
 */
export const todoTools = (r: Resolver) => [
  defineTool({
    name: 'todos.list',
    description: "List the user's tasks. Use filter 'open' for unfinished tasks.",
    inputSchema: {
      type: 'object',
      properties: { filter: { type: 'string', enum: ['all', 'open', 'done'] } },
    },
    parser: z.object({ filter: z.enum(['all', 'open', 'done']).default('all') }),
    async execute({ filter }) {
      const res = await r.get(GetTodosToken).execute(filter);
      if (!res.ok) throw res.error;
      return res.value.map((t) => ({ id: t.id, title: t.title, completed: t.completed }));
    },
  }),
  defineTool({
    name: 'todos.add',
    description: 'Create a new task for the user.',
    inputSchema: {
      type: 'object',
      properties: { title: { type: 'string', maxLength: 120 } },
      required: ['title'],
    },
    parser: z.object({ title: z.string() }),
    requiresConfirmation: true,
    async execute({ title }) {
      const res = await r.get(AddTodoToken).execute(title);
      if (!res.ok) throw res.error;
      return { id: res.value.id, title: res.value.title };
    },
  }),
];
