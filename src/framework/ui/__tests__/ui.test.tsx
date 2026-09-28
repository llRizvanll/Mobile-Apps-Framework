import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createI18n, I18nProvider } from '@framework/i18n';
import { ThemeProvider, createBrandTheme } from '@framework/theme';
import {
  Button,
  DefaultButton,
  ErrorState,
  FormField,
  Text,
  UIProvider,
  frameworkTranslations,
  type ButtonProps,
} from '../index';

const i18n = createI18n({
  defaultLocale: 'en',
  supportedLocales: ['en'],
  resources: { en: { ...frameworkTranslations['en'], greet: 'Hello {{name}}' } },
});

const wrap = (ui: ReactNode, overrides?: Parameters<typeof UIProvider>[0]['components']) => (
  <I18nProvider i18n={i18n}>
    <ThemeProvider brandTheme={createBrandTheme()}>
      <UIProvider {...(overrides ? { components: overrides } : {})}>{ui}</UIProvider>
    </ThemeProvider>
  </I18nProvider>
);

describe('ui', () => {
  it('renders translated text and accessible buttons', async () => {
    const onPress = jest.fn();
    await render(
      wrap(
        <>
          <Text tx="greet" txParams={{ name: 'Ada' }} />
          <Button title="Save" onPress={onPress} />
        </>,
      ),
    );
    expect(screen.getByText('Hello Ada')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('does not fire presses while loading', async () => {
    const onPress = jest.fn();
    await render(wrap(<Button title="Pay" loading onPress={onPress} />));
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('lets a brand override components while decorating the default', async () => {
    const BrandButton = (props: ButtonProps) => (
      <DefaultButton {...props} title={`★ ${props.title ?? ''}`} />
    );
    await render(wrap(<Button title="Buy" />, { Button: BrandButton }));
    expect(screen.getByText('★ Buy')).toBeTruthy();
  });

  it('shows form errors and framework error copy', async () => {
    const onRetry = jest.fn();
    await render(
      wrap(
        <>
          <FormField label="Email" error="Required" testID="email" />
          <ErrorState onRetry={onRetry} />
        </>,
      ),
    );
    expect(screen.getByTestId('email.error')).toHaveTextContent('Required');
    await fireEvent.press(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalled();
  });
});
