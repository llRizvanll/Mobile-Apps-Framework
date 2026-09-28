import { AppError, err, ok, type Json, type Result } from '@framework/foundation';
import type { Resolver } from '@framework/di';
import type { ToolRegistry } from './tools';
import {
  toolCallsOf,
  type AIClient,
  type ChatMessage,
  type ChatRequest,
  type ChatResponse,
  type ToolCallPart,
  type ToolResultPart,
} from './types';

export interface AgentStep {
  readonly response: ChatResponse;
  readonly toolResults: readonly ToolResultPart[];
}

export interface RunAgentOptions extends Omit<ChatRequest, 'messages' | 'tools'> {
  readonly client: AIClient;
  readonly tools?: ToolRegistry;
  readonly messages: readonly ChatMessage[];
  readonly maxSteps?: number;
  readonly signal?: AbortSignal;
  readonly resolver?: Resolver;
  /** Human-in-the-loop gate for tools marked `requiresConfirmation`. */
  readonly confirm?: (call: ToolCallPart) => Promise<boolean>;
  readonly onStep?: (step: AgentStep) => void;
}

export interface AgentResult {
  readonly messages: readonly ChatMessage[];
  readonly response: ChatResponse;
  readonly steps: readonly AgentStep[];
}

/**
 * Tool-use loop: model → tool calls → results → model, until the model stops or `maxSteps`.
 * Tool failures are returned to the model as `isError` results (so it can recover) rather than thrown.
 */
export async function runAgent(options: RunAgentOptions): Promise<Result<AgentResult, AppError>> {
  const {
    client,
    tools,
    maxSteps = 8,
    signal,
    resolver,
    confirm,
    onStep,
    messages: initial,
    ...request
  } = options;
  const messages: ChatMessage[] = [...initial];
  const steps: AgentStep[] = [];
  const controller = new AbortController();
  signal?.addEventListener('abort', () => controller.abort(), { once: true });

  for (let i = 0; i < maxSteps; i++) {
    const res = await client.complete(
      { ...request, messages: [...messages], ...(tools ? { tools: tools.specs() } : {}) },
      { signal: controller.signal },
    );
    if (!res.ok) return res;
    const response = res.value;
    messages.push({ role: 'assistant', content: response.content });

    const calls = toolCallsOf(response);
    if (response.stopReason !== 'tool_use' || calls.length === 0 || !tools) {
      steps.push({ response, toolResults: [] });
      onStep?.(steps[steps.length - 1] as AgentStep);
      return ok({ messages, response, steps });
    }

    const toolResults: ToolResultPart[] = [];
    for (const call of calls)
      toolResults.push(await executeCall(call, tools, controller.signal, resolver, confirm));
    messages.push({ role: 'user', content: toolResults });
    const step = { response, toolResults };
    steps.push(step);
    onStep?.(step);
  }
  return err(
    new AppError('ai', `Agent exceeded ${maxSteps} steps`, { meta: { steps: steps.length } }),
  );
}

async function executeCall(
  call: ToolCallPart,
  tools: ToolRegistry,
  signal: AbortSignal,
  resolver: Resolver | undefined,
  confirm: RunAgentOptions['confirm'],
): Promise<ToolResultPart> {
  const fail = (message: string): ToolResultPart => ({
    type: 'tool_result',
    toolCallId: call.id,
    output: { error: message },
    isError: true,
  });
  const tool = tools.get(call.name);
  if (!tool) return fail(`Unknown tool "${call.name}"`);
  if (tool.requiresConfirmation && !(await confirm?.(call)))
    return fail('User declined this action');
  try {
    const input = tool.parser ? tool.parser.parse(call.input) : call.input;
    const output: Json = await tool.execute(input, { signal, ...(resolver ? { resolver } : {}) });
    return { type: 'tool_result', toolCallId: call.id, output };
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
}
