import { DevSettings, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrandConfig, useFeatureFlagsSnapshot, type FlagSnapshotEntry } from '@framework/core';
import { useTranslation } from '@framework/i18n';
import { useTheme } from '@framework/theme';
import { Box, Button, Divider, Screen, Text } from '@framework/ui';
import type { DevtoolsResources } from '../translations';

/**
 * Developer panel: every registered flag with its effective value and source. Boolean flags can be
 * overridden on-device; module flags show a restart banner because modules are composed at boot.
 */
export function FeatureFlagsScreen() {
  const [snapshot, flags] = useFeatureFlagsSnapshot();
  const config = useBrandConfig();
  const { t } = useTranslation<DevtoolsResources>();
  const insets = useSafeAreaInsets();
  const pending = snapshot.filter((f) => f.restartRequired).map((f) => f.key);

  return (
    <Screen insets={insets} scroll testID="devtools.screen">
      <Text variant="headline" accessibilityRole="header">
        {t('devtools.title')}
      </Text>
      <Text variant="caption" color="onSurfaceMuted">
        {flags.overridesAllowed ? t('devtools.subtitle') : t('devtools.overridesDisabled')}
      </Text>

      {pending.length > 0 ? (
        <Box
          padding="md"
          radius="md"
          background="primaryContainer"
          gap="sm"
          testID="devtools.restartBanner"
        >
          <Text color="onPrimaryContainer">
            {t('devtools.restartBanner', { flags: pending.join(', ') })}
          </Text>
          <Button title={t('devtools.restart')} size="sm" onPress={() => DevSettings.reload()} />
        </Box>
      ) : null}

      <Box>
        {snapshot.map((entry, i) => (
          <Box key={entry.key}>
            {i > 0 ? <Divider /> : null}
            <FlagRow
              entry={entry}
              editable={flags.overridesAllowed}
              onSet={(v) => void flags.setOverride(entry.key, v)}
              onReset={() => void flags.clearOverride(entry.key)}
            />
          </Box>
        ))}
      </Box>

      {flags.overridesAllowed ? (
        <Button
          title={t('devtools.resetAll')}
          variant="outline"
          onPress={() => void flags.clearOverrides()}
          testID="devtools.resetAll"
        />
      ) : null}

      <Text variant="title">{t('devtools.build')}</Text>
      <Text
        variant="caption"
        color="onSurfaceMuted"
      >{`${config.id} · ${config.environment} · v${config.app.version} · ${config.api.rest.baseUrl}`}</Text>
    </Screen>
  );
}

interface FlagRowProps {
  readonly entry: FlagSnapshotEntry;
  readonly editable: boolean;
  readonly onSet: (value: boolean) => void;
  readonly onReset: () => void;
}

function FlagRow({ entry, editable, onSet, onReset }: FlagRowProps) {
  const theme = useTheme();
  const { t } = useTranslation<DevtoolsResources>();
  const isBoolean = typeof entry.value === 'boolean';
  const kind = entry.definition?.kind ?? 'runtime';
  return (
    <Box row align="center" gap="md" paddingY="md" testID={`devtools.flag.${entry.key}`}>
      <Box flex={1} gap="xxs">
        <Text variant="bodyStrong">{entry.key}</Text>
        {entry.definition ? (
          <Text variant="caption" color="onSurfaceMuted">
            {entry.definition.description}
          </Text>
        ) : null}
        <Text variant="caption" color={entry.source === 'override' ? 'primary' : 'onSurfaceMuted'}>
          {`${t(`devtools.kind.${kind}`)} · ${t(`devtools.source.${entry.source}`)}${isBoolean ? '' : ` · ${String(entry.value)}`}`}
        </Text>
      </Box>
      {entry.source === 'override' && editable ? (
        <Button title={t('devtools.reset')} size="sm" variant="ghost" onPress={onReset} />
      ) : null}
      {isBoolean ? (
        <Switch
          value={entry.enabled}
          disabled={!editable}
          onValueChange={onSet}
          trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
          accessibilityLabel={entry.key}
          testID={`devtools.switch.${entry.key}`}
        />
      ) : null}
    </Box>
  );
}
