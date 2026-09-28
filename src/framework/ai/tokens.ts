import { createToken } from '@framework/di';
import type { AITool, ToolRegistry } from './tools';
import type { AIClient } from './types';

export const AIClientToken = createToken<AIClient>('ai.Client');
export const ToolRegistryToken = createToken<ToolRegistry>('ai.ToolRegistry');
/** Multi-binding: feature modules contribute tools; the framework registers them. */
export const AIToolToken = createToken<AITool>('ai.Tool[]');
