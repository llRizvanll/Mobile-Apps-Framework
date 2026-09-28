import { AppError, err, ok } from '@org/foundation';
import type { AIClient, ChatRequest, ChatResponse, ChatStreamEvent } from '../types';

export type ScriptStep =
  ChatResponse | AppError | ((request: ChatRequest) => ChatResponse | AppError);

/**
 * Deterministic AI client for tests, Storybook, offline demos and e2e runs.
 * Responses are consumed in order; `requests` records what the app sent.
 */
export class ScriptedAIClient implements AIClient {
  readonly requests: ChatRequest[] = [];
  constructor(private readonly script: ScriptStep[]) {}

  complete(request: ChatRequest): ReturnType<AIClient['complete']> {
    this.requests.push(request);
    const step = this.script.shift();
    if (!step)
      return Promise.resolve(err(new AppError('ai', 'ScriptedAIClient: script exhausted')));
    const value = typeof step === 'function' ? step(request) : step;
    return Promise.resolve(value instanceof AppError ? err(value) : ok(value));
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatStreamEvent> {
    const res = await this.complete(request);
    if (!res.ok) {
      yield { type: 'error', error: res.error };
      return;
    }
    for (const part of res.value.content) {
      if (part.type === 'text')
        for (const word of part.text.split(/(?<= )/)) yield { type: 'text_delta', text: word };
      if (part.type === 'tool_call') yield { type: 'tool_call', call: part };
    }
    yield { type: 'done', response: res.value };
  }
}

export const textResponse = (text: string): ChatResponse => ({
  content: [{ type: 'text', text }],
  stopReason: 'end',
});
export const toolUseResponse = (id: string, name: string, input: unknown): ChatResponse => ({
  content: [{ type: 'tool_call', id, name, input }],
  stopReason: 'tool_use',
});
