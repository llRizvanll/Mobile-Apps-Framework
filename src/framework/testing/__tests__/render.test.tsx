import { screen } from '@testing-library/react-native';
import { useBrandConfig, useFeatureFlag } from '@framework/core';
import { useTranslation } from '@framework/i18n';
import { Button, DefaultButton, Text, type ButtonProps } from '@framework/ui';
import { createTestBrand, renderWithFramework } from '../index';

function Probe() {
  const config = useBrandConfig();
  const beta = useFeatureFlag('beta');
  const { t } = useTranslation();
  return (
    <>
      <Text>{`${config.displayName}|beta:${String(beta)}`}</Text>
      <Text>{t('greeting')}</Text>
      <Button title="Continue" />
    </>
  );
}

describe('FrameworkProvider', () => {
  it('renders children after boot with brand config, flags, copy and component overrides', async () => {
    const BrandButton = (p: ButtonProps) => <DefaultButton {...p} title={`[${p.title ?? ''}]`} />;
    const brand = createTestBrand({
      config: { displayName: 'Acme', features: { beta: true } },
      translations: { en: { greeting: 'Welcome to Acme' } },
      components: { Button: BrandButton },
    });
    await renderWithFramework(<Probe />, { brand });
    expect(await screen.findByText('Acme|beta:true')).toBeTruthy();
    expect(screen.getByText('Welcome to Acme')).toBeTruthy();
    expect(screen.getByText('[Continue]')).toBeTruthy();
  });
});
