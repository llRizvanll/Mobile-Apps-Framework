import { assistantModule } from '@features/assistant/module';
import { devtoolsModule } from '@features/devtools/module';
import { settingsModule } from '@features/settings/module';
import { todosModule } from '@features/todos/module';

/**
 * Every feature module compiled into the app. Order doesn't matter (dependencies are topo-sorted).
 * Whether a module is active is decided by its feature flag — see src/config/feature-flags.json.
 * `npm run gen:feature` appends new modules here.
 */
export const appModules = [todosModule, assistantModule, settingsModule, devtoolsModule];
