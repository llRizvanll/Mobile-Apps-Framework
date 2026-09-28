import {
  runAgent,
  textOf,
  type AIClient,
  type ChatMessage,
  type ToolCallPart,
  type ToolRegistry,
} from '@org/ai';
import { createMviStore, type MviStore } from '@org/presentation';

export interface Bubble {
  readonly id: string;
  readonly from: 'user' | 'assistant';
  readonly text: string;
}

export interface AssistantState {
  readonly bubbles: readonly Bubble[];
  /** Full model transcript incl. tool calls — kept separate from what the UI shows. */
  readonly transcript: readonly ChatMessage[];
  readonly input: string;
  readonly status: 'idle' | 'thinking' | 'error';
}

export type AssistantIntent =
  | { readonly type: 'inputChanged'; readonly text: string }
  | { readonly type: 'send' }
  | { readonly type: 'replied'; readonly transcript: readonly ChatMessage[]; readonly text: string }
  | { readonly type: 'failed' };

export type AssistantEffect = { readonly type: 'scrollToEnd' };

export interface AssistantDeps {
  readonly client: AIClient;
  readonly tools: ToolRegistry;
  readonly system: string;
  readonly model: string;
  readonly confirm: (call: ToolCallPart) => Promise<boolean>;
}

let seq = 0;
const bubble = (from: Bubble['from'], text: string): Bubble => ({
  id: `${Date.now()}-${seq++}`,
  from,
  text,
});

/** MVI: every state change is an explicit intent — easy to trace, replay and test. */
export function createAssistantStore(
  deps: AssistantDeps,
): MviStore<AssistantState, AssistantIntent, AssistantEffect> {
  return createMviStore<AssistantState, AssistantIntent, AssistantEffect>({
    initialState: { bubbles: [], transcript: [], input: '', status: 'idle' },
    reduce(state, intent) {
      switch (intent.type) {
        case 'inputChanged':
          return { ...state, input: intent.text };
        case 'send': {
          const text = state.input.trim();
          if (!text || state.status === 'thinking') return state;
          return {
            ...state,
            input: '',
            status: 'thinking',
            bubbles: [...state.bubbles, bubble('user', text)],
            transcript: [...state.transcript, { role: 'user', content: text }],
          };
        }
        case 'replied':
          return {
            ...state,
            status: 'idle',
            transcript: intent.transcript,
            bubbles: [...state.bubbles, bubble('assistant', intent.text)],
          };
        case 'failed':
          return { ...state, status: 'error' };
      }
    },
    async effects(intent, { getState, dispatch, emit, signal }) {
      if (intent.type !== 'send' || getState().status !== 'thinking') return;
      emit({ type: 'scrollToEnd' });
      const res = await runAgent({
        client: deps.client,
        tools: deps.tools,
        messages: getState().transcript,
        system: deps.system,
        model: deps.model,
        confirm: deps.confirm,
        metadata: { feature: 'assistant' },
        signal,
      });
      if (!res.ok) return dispatch({ type: 'failed' });
      dispatch({
        type: 'replied',
        transcript: res.value.messages,
        text: textOf(res.value.response.content),
      });
      emit({ type: 'scrollToEnd' });
    },
    onError: () => undefined,
  });
}
