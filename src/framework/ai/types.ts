import type { AppError, Json, Result } from '@framework/foundation';

export type TextPart = { readonly type: 'text'; readonly text: string };
export type ImagePart = {
  readonly type: 'image';
  readonly url: string;
  readonly mediaType?: string;
};
export type ToolCallPart = {
  readonly type: 'tool_call';
  readonly id: string;
  readonly name: string;
  readonly input: unknown;
};
export type ToolResultPart = {
  readonly type: 'tool_result';
  readonly toolCallId: string;
  readonly output: Json;
  readonly isError?: boolean;
};
export type ContentPart = TextPart | ImagePart | ToolCallPart | ToolResultPart;

export interface ChatMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string | readonly ContentPart[];
}

/** JSON Schema subset describing tool input — what every major vendor accepts. */
export interface JsonSchema {
  readonly type?: string | readonly string[];
  readonly description?: string;
  readonly properties?: Readonly<Record<string, JsonSchema>>;
  readonly required?: readonly string[];
  readonly items?: JsonSchema;
  readonly enum?: readonly Json[];
  readonly additionalProperties?: boolean | JsonSchema;
  readonly [key: string]: unknown;
}

export interface ToolSpec {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: JsonSchema;
}

/**
 * Logical model tiers. The backend (or adapter) maps tiers to concrete vendor models, so apps
 * never hard-code model ids and brands can switch vendors without an app release.
 */
export type ModelTier = 'fast' | 'balanced' | 'smart' | (string & {});

export interface ChatRequest {
  readonly messages: readonly ChatMessage[];
  readonly system?: string;
  readonly model?: ModelTier;
  readonly tools?: readonly ToolSpec[];
  readonly maxTokens?: number;
  readonly temperature?: number;
  /** Non-PII tags forwarded for routing/analytics (feature, screen, experiment). */
  readonly metadata?: Readonly<Record<string, string>>;
}

export type StopReason = 'end' | 'tool_use' | 'max_tokens' | 'refusal' | 'other';

export interface Usage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface ChatResponse {
  readonly content: readonly ContentPart[];
  readonly stopReason: StopReason;
  readonly usage?: Usage;
  readonly model?: string;
}

export type ChatStreamEvent =
  | { readonly type: 'text_delta'; readonly text: string }
  | { readonly type: 'tool_call'; readonly call: ToolCallPart }
  | { readonly type: 'done'; readonly response: ChatResponse }
  | { readonly type: 'error'; readonly error: AppError };

export interface AICallOptions {
  readonly signal?: AbortSignal;
}

/** The vendor-neutral port. Adapters: HTTP proxy (recommended), scripted (tests/demo), vendor SDKs. */
export interface AIClient {
  complete(request: ChatRequest, options?: AICallOptions): Promise<Result<ChatResponse, AppError>>;
  stream(request: ChatRequest, options?: AICallOptions): AsyncIterable<ChatStreamEvent>;
}

export const textOf = (content: ChatMessage['content'] | ChatResponse['content']): string =>
  typeof content === 'string'
    ? content
    : content
        .filter((p): p is TextPart => p.type === 'text')
        .map((p) => p.text)
        .join('');

export const toolCallsOf = (response: ChatResponse): ToolCallPart[] =>
  response.content.filter((p): p is ToolCallPart => p.type === 'tool_call');
