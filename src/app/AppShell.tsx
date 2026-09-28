import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInject, useModuleTabs } from '@framework/core';
import { useTranslation } from '@framework/i18n';
import { AnalyticsToken } from '@framework/observability';
import { Box, Button, EmptyState } from '@framework/ui';

/**
 * Tab shell built from the tabs of active modules (see FrameworkModule.tabs). Enabling or disabling a
 * feature flag adds/removes its tab with no changes here. Swap for expo-router / React Navigation by
 * mapping the same `useModuleTabs()` list to routes.
 */
export function AppShell() {
  const tabs = useModuleTabs();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const analytics = useInject(AnalyticsToken);
  const [selected, setSelected] = useState<string | undefined>(tabs[0]?.key);
  const active = tabs.find((tab) => tab.key === selected) ?? tabs[0];

  useEffect(() => {
    if (active) analytics.screen(active.key);
  }, [active, analytics]);

  if (!active)
    return (
      <EmptyState
        title="No features enabled"
        message="Enable a module flag in src/config/feature-flags.json."
      />
    );
  const Active = active.component;

  return (
    <Box flex={1} background="background">
      <Box flex={1}>
        <Active />
      </Box>
      <Box
        row
        justify="space-around"
        paddingY="sm"
        background="surface"
        style={{ paddingBottom: insets.bottom + 8 }}
        accessibilityRole="tablist"
      >
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            title={t(tab.titleKey)}
            size="sm"
            variant={tab.key === active.key ? 'secondary' : 'ghost'}
            onPress={() => setSelected(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab.key === active.key }}
            testID={`tab.${tab.key}`}
          />
        ))}
      </Box>
    </Box>
  );
}
