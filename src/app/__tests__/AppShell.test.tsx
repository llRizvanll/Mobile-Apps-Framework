import main from '@brands/main';
import { featureFlags } from '@config/featureFlags';
import { FeatureFlagsToken, type BrandDefinition } from '@framework/core';
import { renderWithFramework } from '@framework/testing';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppShell } from '../AppShell';
import { appModules } from '../modules';

// Uses the permanent modules only (settings, devtools); see bootstrap.test.tsx.
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const withFeatures = (features: Record<string, boolean>): BrandDefinition => ({
  ...main,
  config: { ...main.config, features: { ...main.config.features, ...features } },
});
const renderShell = (brand: BrandDefinition = main) =>
  renderWithFramework(
    <SafeAreaProvider initialMetrics={metrics}>
      <AppShell />
    </SafeAreaProvider>,
    { brand, modules: appModules, flags: { definitions: featureFlags } },
  );
const tabIds = () => screen.getAllByRole('tab').map((t) => t.props.testID as string);

describe('AppShell', () => {
  it('renders a tab per active module, ordered', async () => {
    await renderShell();
    const tabs = tabIds();
    expect(tabs.indexOf('tab.settings')).toBeGreaterThanOrEqual(0);
    expect(tabs.indexOf('tab.settings')).toBeLessThan(tabs.indexOf('tab.devtools'));
  });

  it('omits the tab of a module whose flag is off', async () => {
    await renderShell(withFeatures({ settings: false }));
    expect(screen.queryByTestId('tab.settings')).toBeNull();
  });

  it('shows and hides tabs live with runtime flags', async () => {
    const { app } = await renderShell();
    await act(() => app.container.get(FeatureFlagsToken).setOverride('devtools', false));
    expect(screen.queryByTestId('tab.devtools')).toBeNull();
  });

  it('dev panel overrides flags and asks for a restart for module flags', async () => {
    await renderShell();
    await fireEvent.press(screen.getByTestId('tab.devtools'));
    await fireEvent(await screen.findByTestId('devtools.switch.settings'), 'valueChange', false);
    expect(await screen.findByTestId('devtools.restartBanner')).toHaveTextContent(/settings/);
  });
});
