import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrandConfig } from '@framework/core';
import { useTranslation } from '@framework/i18n';
import {
  settingsSlice,
  useAppDispatch,
  useAppSelector,
  type ThemePreference,
} from '@framework/state';
import { Box, Button, Screen, Text } from '@framework/ui';
import type { SettingsResources } from '../translations';

const LOCALE_NAMES: Record<string, string> = { en: 'English', ar: 'العربية' };
const THEMES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export function SettingsScreen() {
  const config = useBrandConfig();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.settings);
  const { t, i18n } = useTranslation<SettingsResources>();
  const insets = useSafeAreaInsets();

  return (
    <Screen insets={insets} scroll testID="settings.screen">
      <Text variant="headline" accessibilityRole="header">
        {config.displayName}
      </Text>
      <Text color="onSurfaceMuted">{i18n.t('brand.tagline')}</Text>

      <Text variant="title">{t('settings.theme')}</Text>
      <Box row gap="sm">
        {THEMES.map((p) => (
          <Button
            key={p}
            title={t(`settings.themes.${p}`)}
            size="sm"
            variant={settings.themePreference === p ? 'primary' : 'outline'}
            onPress={() => dispatch(settingsSlice.actions.themePreferenceChanged(p))}
          />
        ))}
      </Box>

      <Text variant="title">{t('settings.language')}</Text>
      <Box row gap="sm">
        {config.i18n.supportedLocales.map((l) => (
          <Button
            key={l}
            title={LOCALE_NAMES[l] ?? l}
            size="sm"
            variant={i18n.locale === l ? 'primary' : 'outline'}
            onPress={() => dispatch(settingsSlice.actions.localeChanged(l))}
          />
        ))}
      </Box>

      <Text variant="title">{t('settings.analytics')}</Text>
      <Button
        title={settings.analyticsConsent ? t('settings.optedIn') : t('settings.optedOut')}
        size="sm"
        variant="outline"
        onPress={() =>
          dispatch(settingsSlice.actions.analyticsConsentChanged(!settings.analyticsConsent))
        }
      />
      <Text
        variant="caption"
        color="onSurfaceMuted"
      >{`${config.id} · ${config.environment} · v${config.app.version}`}</Text>
    </Screen>
  );
}
