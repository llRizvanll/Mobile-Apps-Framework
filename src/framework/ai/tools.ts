import { AppError, type Json, type Parser } from '@framework/foundation';
import type { Resolver } from '@framework/di';
import type { JsonSchema, ToolSpec } from './types';

export interface ToolContext {
  readonly signal: AbortSignal;
  readonly resolver?: Resolver;
}

/**
 * A capability a feature exposes to AI agents (e.g. `cart.addItem`, `orders.track`).
 * Tools are how the app becomes AI-native: the assistant acts through the same use cases the UI uses.
 */
export interface AITool<I = unknown, O extends Json = Json> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: JsonSchema;
  /** Validates model-produced input before execution (zod schema or any `{ parse }`). */
  readonly parser?: Parser<I>;
  /** Side-effecting tools must be confirmed by the user before running. */
  readonly requiresConfirmation?: boolean;
  execute(input: I, context: ToolContext): Promise<O>;
}

export const defineTool = <I, O extends Json = Json>(tool: AITool<I, O>): AITool<I, O> => tool;

const NAME = /^[a-zA-Z0-9_.-]{1,64}$/;

export class ToolRegistry {
  private readonly tools = new Map<string, AITool>();

  register(...tools: AITool[]): this {
    for (const tool of tools) {
      if (!NAME.test(tool.name)) throw new AppError('ai', `Invalid tool name "${tool.name}"`);
      if (this.tools.has(tool.name))
        throw new AppError('ai', `Tool "${tool.name}" already registered`);
      this.tools.set(tool.name, tool);
    }
    return this;
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): AITool | undefined {
    return this.tools.get(name);
  }

  list(filter?: (tool: AITool) => boolean): AITool[] {
    const all = [...this.tools.values()];
    return filter ? all.filter(filter) : all;
  }

  /** Wire-format specs to send with a `ChatRequest`. */
  specs(filter?: (tool: AITool) => boolean): ToolSpec[] {
    return this.list(filter).map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    }));
  }
}
