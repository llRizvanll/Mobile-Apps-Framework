import { flag } from '@config/featureFlags';
import { defineModule } from '@framework/core';
import { AppError } from '@framework/foundation';
import { AssistantScreen } from './presentation/AssistantScreen';
import { ar, en } from './translations';

/** Requires the `assistant` flag (which itself requires `todos`) and `ai.enabled` in the brand config. */
export const assistantModule = defineModule({
  id: 'assistant',
  featureFlag: flag('assistant'),
  dependsOn: ['todos'],
  register(_container, config) {
    if (!config.ai.enabled) {
      throw new AppError(
        'config',
        `The "assistant" flag is on for brand "${config.id}" but ai.enabled is false in its config.`,
      );
    }
  },
  translations: { en, ar },
  tabs: [{ key: 'assistant', titleKey: 'assistant.tab', component: AssistantScreen, order: 20 }],
});
