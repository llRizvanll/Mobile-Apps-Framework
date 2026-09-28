# @org/ai

Vendor-neutral AI: client port, tools, agent loop, streaming.

```ts
const todosAdd = defineTool({
  name: 'todos.add', description: 'Create a task', inputSchema: {...}, parser: z.object({ title: z.string() }),
  requiresConfirmation: true, execute: ({ title }) => addTodo.execute(title).then(unwrap),
});
const res = await runAgent({ client, tools: registry, messages, confirm: askUser, maxSteps: 8 });
for await (const ev of client.stream(request)) { ... }            // text_delta | tool_call | done | error
```

- `createHttpProxyAIClient` (production: your backend holds vendor keys; SSE streaming via `expo/fetch`).
- `ScriptedAIClient` for tests/demos; `withObservability(client, deps)` adds spans + usage analytics (no content logged).
- Model tiers (`fast`/`balanced`/`smart`) are mapped server-side.
- Modules contribute tools via `module.tools(resolver)` or the `AIToolToken` multi-binding.
