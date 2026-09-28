import type { ChatRequest, ChatResponse, ToolResultPart } from '@org/ai';
import type { HttpRequest, HttpResponse, HttpTransport } from '@org/network';

/**
 * In-process fake API (todos + AI chat) so the app runs end-to-end with no server:
 * `EXPO_PUBLIC_API_MODE=mock` (default in development). Also handy for demos and e2e tests.
 */
export function createMockBackend(latencyMs = 250): HttpTransport {
  let nextId = 3;
  const todos = [
    {
      id: '1',
      title: 'Explore the framework packages',
      completed: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Generate a new brand',
      completed: false,
      created_at: new Date().toISOString(),
    },
  ];

  const reply = (request: HttpRequest, status: number, data: unknown): HttpResponse => ({
    status,
    headers: { 'content-type': 'application/json' },
    data,
    request,
  });

  return async (req) => {
    await new Promise((r) => setTimeout(() => r(undefined), latencyMs));
    const path = new URL(req.url).pathname.replace(/^\/v1|^\/api/, '');

    if (path === '/todos' && req.method === 'GET')
      return reply(req, 200, { items: [...todos].reverse() });
    if (path === '/todos' && req.method === 'POST') {
      const todo = {
        id: String(nextId++),
        title: (req.body as { title: string }).title,
        completed: false,
        created_at: new Date().toISOString(),
      };
      todos.push(todo);
      return reply(req, 201, todo);
    }
    const match = /^\/todos\/(.+)$/.exec(path);
    if (match && req.method === 'PATCH') {
      const todo = todos.find((t) => t.id === decodeURIComponent(match[1] ?? ''));
      if (!todo) return reply(req, 404, { error: 'not found' });
      todo.completed = (req.body as { completed: boolean }).completed;
      return reply(req, 200, todo);
    }
    if (path === '/ai/chat' && req.method === 'POST')
      return reply(req, 200, fakeAssistant(req.body as ChatRequest));
    return reply(req, 404, { error: `No mock route for ${req.method} ${path}` });
  };
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
