import { defineModule } from '@org/core';
import { ar, en } from './translations';

/** Requires `ai.enabled` in brand config (AIClient binding) and the `assistant` flag. */
export const assistantModule = defineModule({
  id: 'assistant',
  featureFlag: 'assistant',
  dependsOn: ['todos'],
  translations: { en, ar },
});
