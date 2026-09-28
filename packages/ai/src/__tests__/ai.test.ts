import { z } from 'zod';
import { AppError } from '@org/foundation';
import {
  ScriptedAIClient,
  ToolRegistry,
  defineTool,
  parseSSE,
  runAgent,
  textOf,
  textResponse,
  toolUseResponse,
} from '../index';

async function* chunks(...parts: string[]) {
  for (const p of parts) yield p;
}

describe('ToolRegistry', () => {
  it('validates names and prevents duplicates', () => {
    const reg = new ToolRegistry();
    const tool = defineTool({
      name: 'ok.tool',
      description: 'x',
      inputSchema: {},
      execute: () => Promise.resolve(null),
    });
    reg.register(tool);
    expect(() => reg.register(tool)).toThrow(/already registered/);
    expect(() => reg.register({ ...tool, name: 'bad name!' })).toThrow(/Invalid tool name/);
    expect(reg.specs()).toEqual([{ name: 'ok.tool', description: 'x', inputSchema: {} }]);
  });
});

describe('runAgent', () => {
  const addToCart = defineTool({
    name: 'cart.add',
    description: 'Add a product to the cart',
    inputSchema: {
      type: 'object',
      properties: { sku: { type: 'string' }, qty: { type: 'number' } },
      required: ['sku'],
    },
    parser: z.object({ sku: z.string(), qty: z.number().default(1) }),
    requiresConfirmation: true,
    execute: ({ sku, qty }) => Promise.resolve({ added: sku, qty }),
  });

  it('executes tool calls with validation + confirmation and loops to a final answer', async () => {
    const client = new ScriptedAIClient([
      toolUseResponse('c1', 'cart.add', { sku: 'A1' }),
      textResponse('Added A1 to your cart.'),
    ]);
    const confirm = jest.fn(() => Promise.resolve(true));
    const res = await runAgent({
      client,
      tools: new ToolRegistry().register(addToCart),
      messages: [{ role: 'user', content: 'add A1' }],
      confirm,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(textOf(res.value.response.content)).toBe('Added A1 to your cart.');
    expect(res.value.steps[0]?.toolResults[0]).toEqual({
      type: 'tool_result',
      toolCallId: 'c1',
      output: { added: 'A1', qty: 1 },
    });
    expect(client.requests[1]?.messages).toHaveLength(3);
    expect(client.requests[0]?.tools?.[0]?.name).toBe('cart.add');
  });

  it('returns declined/invalid tool calls to the model as errors', async () => {
    const client = new ScriptedAIClient([
      toolUseResponse('c1', 'cart.add', { sku: 'A1' }),
      toolUseResponse('c2', 'cart.add', { sku: 42 }),
      toolUseResponse('c3', 'nope', {}),
      textResponse('ok'),
    ]);
    const confirm = jest.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    const res = await runAgent({
      client,
      tools: new ToolRegistry().register(addToCart),
      messages: [{ role: 'user', content: 'go' }],
      confirm,
    });
    const results = res.ok ? res.value.steps.flatMap((s) => s.toolResults) : [];
    expect(results.map((r) => r.isError)).toEqual([true, true, true]);
    expect(results[0]?.output).toEqual({ error: 'User declined this action' });
  });

  it('stops after maxSteps and propagates client errors', async () => {
    const looping = new ScriptedAIClient(
      Array.from({ length: 5 }, (_, i) => toolUseResponse(`c${i}`, 'x', {})),
    );
    const res = await runAgent({
      client: looping,
      tools: new ToolRegistry(),
      messages: [],
      maxSteps: 2,
    });
    expect(!res.ok && res.error.message).toMatch(/exceeded 2 steps/);

    const failing = new ScriptedAIClient([new AppError('ai', 'rate limited', { retryable: true })]);
    const res2 = await runAgent({ client: failing, messages: [] });
    expect(!res2.ok && res2.error.message).toBe('rate limited');
  });
});

describe('parseSSE', () => {
  it('handles split chunks, multi-line data, comments and CRLF', async () => {
    const out = [];
    for await (const m of parseSSE(
      chunks(
        ': hi\n',
        'event: delta\nda',
        'ta: {"a":1}\r\n\r\n',
        'data: line1\ndata: line2\n\n',
        'data: tail',
      ),
    ))
      out.push(m);
    expect(out).toEqual([
      { event: 'delta', data: '{"a":1}' },
      { event: 'message', data: 'line1\nline2' },
      { event: 'message', data: 'tail' },
    ]);
  });
});
