import type { ChatRequest, ChatResponse, ToolResultPart } from '@framework/ai';
import { route, type MockRoute } from './mockBackend';

/**
 * Mock endpoints for the example features (todos, assistant). Deleted by `npm run examples:remove`.
 */
export function exampleRoutes(): MockRoute[] {
  let nextId = 3;
  const now = () => new Date().toISOString();
  const todos = [
    { id: '1', title: 'Explore the framework', completed: true, created_at: now() },
    { id: '2', title: 'Build my first feature', completed: false, created_at: now() },
  ];
  return [
    route('GET', '/todos', () => ({ data: { items: [...todos].reverse() } })),
    route('POST', '/todos', (req) => {
      const todo = {
        id: String(nextId++),
        title: (req.body as { title: string }).title,
        completed: false,
        created_at: now(),
      };
      todos.push(todo);
      return { status: 201, data: todo };
    }),
    route('PATCH', '/todos/:id', (req, { id }) => {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return { status: 404, data: { error: 'not found' } };
      todo.completed = (req.body as { completed: boolean }).completed;
      return { data: todo };
    }),
    route('POST', '/ai/chat', (req) => ({ data: fakeAssistant(req.body as ChatRequest) })),
  ];
}

/** Rule-based stand-in for an LLM that exercises the real tool-use loop. */
function fakeAssistant(request: ChatRequest): ChatResponse {
  const last = request.messages[request.messages.length - 1];
  const content = last?.content;
  if (typeof content !== 'string' && content?.[0]?.type === 'tool_result') {
    const result: ToolResultPart = content[0];
    if (result.isError) return text(`I couldn't do that: ${JSON.stringify(result.output)}`);
    if (Array.isArray(result.output)) {
      const open = (result.output as { title: string; completed: boolean }[]).filter(
        (t) => !t.completed,
      );
      return text(
        open.length
          ? `You have ${open.length} open task(s): ${open.map((t) => t.title).join(', ')}.`
          : 'Everything is done!',
      );
    }
    return text(`Done — added "${(result.output as { title: string }).title}".`);
  }
  const said = typeof content === 'string' ? content : '';
  const add = /^(?:add|create|remind me to)\s+(.+)/i.exec(said);
  if (add?.[1]) return tool('todos.add', { title: add[1] });
  if (/task|todo|list|open|what/i.test(said)) return tool('todos.list', { filter: 'open' });
  return text('Try "what are my tasks?" or "add buy milk".');
}

const text = (t: string): ChatResponse => ({
  content: [{ type: 'text', text: t }],
  stopReason: 'end',
  usage: { inputTokens: 10, outputTokens: 10 },
});
const tool = (name: string, input: unknown): ChatResponse => ({
  content: [{ type: 'tool_call', id: `call_${Date.now()}`, name, input }],
  stopReason: 'tool_use',
});
