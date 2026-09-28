import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrandConfig } from '@org/core';
import { useTranslation } from '@org/i18n';
import { settingsSlice, useAppDispatch, useAppSelector, type ThemePreference } from '@org/state';
import { Box, Button, Screen, Text } from '@org/ui';

const LOCALE_NAMES: Record<string, string> = { en: 'English', ar: 'العربية', fr: 'Français' };

export function SettingsScreen() {
  const config = useBrandConfig();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.settings);
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Screen insets={insets} scroll>
      <Text variant="headline">{config.displayName}</Text>
      <Text color="onSurfaceMuted">{i18n.t('brand.tagline')}</Text>

      <Text variant="title">Theme</Text>
      <Box row gap="sm">
        {(['system', 'light', 'dark'] as ThemePreference[]).map((p) => (
          <Button
            key={p}
            title={p}
            size="sm"
            variant={settings.themePreference === p ? 'primary' : 'outline'}
            onPress={() => dispatch(settingsSlice.actions.themePreferenceChanged(p))}
          />
        ))}
      </Box>

      <Text variant="title">Language</Text>
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

      <Text variant="title">Analytics</Text>
      <Button
        title={settings.analyticsConsent ? 'Opted in' : 'Opted out'}
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
