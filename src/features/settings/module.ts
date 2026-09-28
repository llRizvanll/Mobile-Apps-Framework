import { flag } from '@config/featureFlags';
import { defineModule } from '@framework/core';
import { SettingsScreen } from './presentation/SettingsScreen';
import { ar, en } from './translations';

export const settingsModule = defineModule({
  id: 'settings',
  featureFlag: flag('settings'),
  translations: { en, ar },
  tabs: [{ key: 'settings', titleKey: 'settings.tab', component: SettingsScreen, order: 90 }],
});
