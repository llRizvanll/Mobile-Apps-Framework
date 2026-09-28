import { AppError } from '@org/foundation';
import type { HttpClient } from '@org/network';
import { decodeStream, parseSSE, type ByteStream } from '../sse';
import type { AIClient, ChatResponse, ChatStreamEvent } from '../types';

export type StreamingFetch = (
  url: string,
  init: { method: 'POST'; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; body: ByteStream | null }>;

export interface HttpProxyAIClientOptions {
  readonly http: HttpClient;
  /** Backend endpoint accepting `ChatRequest` and returning `ChatResponse`. */
  readonly path: string;
  /** Absolute URL of the SSE endpoint emitting `ChatStreamEvent` JSON frames. */
  readonly streamUrl?: string;
  /** Streaming-capable fetch (e.g. `fetch` from `expo/fetch`). Without it, `stream` degrades to `complete`. */
  readonly streamingFetch?: StreamingFetch;
  /** Headers for the streaming request (auth) — the HttpClient pipeline is bypassed for SSE. */
  readonly streamHeaders?: () => Promise<Record<string, string>>;
}

/**
 * Recommended production adapter: the app talks to *your* backend, which holds vendor API keys,
 * enforces quotas/safety policy, and maps model tiers to vendor models. Never ship vendor keys in an app.
 */
export function createHttpProxyAIClient(options: HttpProxyAIClientOptions): AIClient {
  const { http, path } = options;

  const complete: AIClient['complete'] = async (request, callOptions) => {
    const res = await http.post<ChatResponse>(path, request, {
      meta: { operation: `ai ${request.model ?? 'default'}`, retry: false },
      timeoutMs: 120_000,
      ...(callOptions?.signal ? { signal: callOptions.signal } : {}),
    });
    return res.ok ? { ok: true, value: res.value.data } : res;
  };

  async function* stream(
    request: Parameters<AIClient['stream']>[0],
    callOptions?: Parameters<AIClient['stream']>[1],
  ): AsyncGenerator<ChatStreamEvent> {
    if (!options.streamingFetch || !options.streamUrl) {
      const res = await complete(request, callOptions);
      if (!res.ok) {
        yield { type: 'error', error: res.error };
        return;
      }
      for (const part of res.value.content) {
        if (part.type === 'text') yield { type: 'text_delta', text: part.text };
        if (part.type === 'tool_call') yield { type: 'tool_call', call: part };
      }
      yield { type: 'done', response: res.value };
      return;
    }
    try {
      const res = await options.streamingFetch(options.streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(await options.streamHeaders?.()),
        },
        body: JSON.stringify(request),
        ...(callOptions?.signal ? { signal: callOptions.signal } : {}),
      });
      if (!res.ok || !res.body)
        throw new AppError('ai', `AI stream failed with HTTP ${res.status}`, {
          retryable: res.status >= 500,
        });
      for await (const msg of parseSSE(decodeStream(res.body))) {
        if (msg.data === '[DONE]') return;
        yield JSON.parse(msg.data) as ChatStreamEvent;
      }
    } catch (e) {
      yield { type: 'error', error: AppError.from(e, 'ai') };
    }
  }

  return { complete, stream };
}
