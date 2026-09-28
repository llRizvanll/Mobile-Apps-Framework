import { defineModule } from '@framework/core';
import { FeatureFlagsScreen } from './presentation/FeatureFlagsScreen';
import { en } from './translations';

/** Always compiled in; the tab is shown only while the `devtools` runtime flag is on. */
export const devtoolsModule = defineModule({
  id: 'devtools',
  translations: { en },
  tabs: [
    {
      key: 'devtools',
      titleKey: 'devtools.tab',
      component: FeatureFlagsScreen,
      order: 100,
      visibleWhen: 'devtools',
    },
  ],
});
