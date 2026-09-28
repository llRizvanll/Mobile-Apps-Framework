import { createToken } from '@org/di';
import type { LayoutDirectionAdapter } from './rtl';
import type { I18nService } from './service';

export const I18nToken = createToken<I18nService>('i18n.Service');
/** Provides device locale preferences (expo-localization / react-native-localize adapter). */
export const DeviceLocalesToken = createToken<() => readonly string[]>('i18n.DeviceLocales');
export const LayoutDirectionToken = createToken<LayoutDirectionAdapter>('i18n.LayoutDirection');
