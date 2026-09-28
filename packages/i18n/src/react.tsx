import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { I18nService } from './service';
import type { TranslateParams, TranslationKeyOf } from './types';

const I18nContext = createContext<I18nService | null>(null);

export function I18nProvider({
  i18n,
  children,
}: {
  readonly i18n: I18nService;
  readonly children: ReactNode;
}): ReactNode {
  return <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nService {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error('useI18n must be used inside <I18nProvider> / <FrameworkProvider>');
  return i18n;
}

/**
 * Re-renders on locale change. Pass your base-locale resource type for checked keys:
 *   const { t } = useTranslation<typeof en>();
 */
export function useTranslation<R = never>() {
  const i18n = useI18n();
  const locale = useSyncExternalStore(i18n.onChange, () => i18n.locale);
  // `locale` is a deliberate dependency: a new `t` identity lets memoised children re-render on change.
  const t = useCallback(
    (key: TranslationKeyOf<R>, params?: TranslateParams): string => i18n.t(key, params),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
    [i18n, locale],
  );
  return { t, locale, direction: i18n.direction, i18n };
}
