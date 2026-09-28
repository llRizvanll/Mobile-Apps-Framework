import type { Analytics, Logger, Tracer } from '@org/observability';
import type { AIClient } from './types';

/**
 * Decorator adding tracing, usage analytics and error logging to any `AIClient`.
 * Prompt/response *content* is never logged — only sizes, tiers, latency and token usage.
 */
export function withObservability(
  client: AIClient,
  deps: { tracer?: Tracer; analytics?: Analytics; logger?: Logger },
): AIClient {
  return {
    async complete(request, options) {
      const run = async (): ReturnType<AIClient['complete']> => {
        const started = Date.now();
        const res = await client.complete(request, options);
        const props = {
          model: request.model ?? 'default',
          feature: request.metadata?.['feature'] ?? 'unknown',
          ms: Date.now() - started,
          ok: res.ok,
          ...(res.ok && res.value.usage
            ? {
                inputTokens: res.value.usage.inputTokens,
                outputTokens: res.value.usage.outputTokens,
              }
            : {}),
        };
        deps.analytics?.track('ai_completion', props);
        if (!res.ok) deps.logger?.warn('ai.fail', { code: res.error.code, model: props.model });
        return res;
      };
      return deps.tracer
        ? deps.tracer.withSpan('ai.complete', run, {
            'ai.model': request.model ?? 'default',
            'ai.messages': request.messages.length,
          })
        : run();
    },
    stream: (request, options) => client.stream(request, options),
  };
}
