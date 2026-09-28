import type { Direction } from './types';

const RTL_LANGS = new Set([
  'ar',
  'arc',
  'ckb',
  'dv',
  'fa',
  'ha',
  'he',
  'iw',
  'khw',
  'ks',
  'ku',
  'ps',
  'sd',
  'ur',
  'yi',
]);

export const languageOf = (locale: string): string =>
  locale.split(/[-_]/)[0]?.toLowerCase() ?? locale;

export const directionOf = (locale: string): Direction =>
  RTL_LANGS.has(languageOf(locale)) ? 'rtl' : 'ltr';

/** Port over RN `I18nManager` — layout direction changes require an app reload on native. */
export interface LayoutDirectionAdapter {
  readonly isRTL: boolean;
  allowRTL(allow: boolean): void;
  forceRTL(force: boolean): void;
  /** Called when direction changed; typically reloads the JS bundle (expo-updates / DevSettings). */
  requestReload?(): void;
}

/** Aligns native layout direction with the locale. Returns true if a reload is required. */
export function syncLayoutDirection(adapter: LayoutDirectionAdapter, locale: string): boolean {
  const rtl = directionOf(locale) === 'rtl';
  adapter.allowRTL(true);
  if (adapter.isRTL === rtl) return false;
  adapter.forceRTL(rtl);
  adapter.requestReload?.();
  return true;
}
