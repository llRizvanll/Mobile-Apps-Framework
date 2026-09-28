import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { ContainerProvider } from '@framework/di/react';
import { I18nProvider, I18nToken } from '@framework/i18n';
import { CrashReporterToken } from '@framework/observability';
import { appSlice, settingsSlice, useAppSelector } from '@framework/state';
import { ThemeProvider } from '@framework/theme';
import { ErrorBoundary, ErrorState, Screen, Spinner, UIProvider } from '@framework/ui';
import type { FrameworkApp } from '../kernel';
import { BrandThemeToken, UIOverridesToken } from '../tokens';

const FrameworkContext = createContext<FrameworkApp | null>(null);

export function useFramework(): FrameworkApp {
  const app = useContext(FrameworkContext);
  if (!app) throw new Error('useFramework must be used inside <FrameworkProvider>');
  return app;
}

export interface FrameworkProviderProps {
  readonly app: FrameworkApp;
  readonly children: ReactNode;
  /** Rendered while booting (keep the native splash visible until then if you prefer). */
  readonly splash?: ReactNode;
  /** Rendered when boot fails. */
  readonly bootError?: (error: string, retry: () => void) => ReactNode;
}

/**
 * Single root provider: Redux → DI → i18n → theme (driven by persisted preference) → UI overrides
 * → error boundary (reported to CrashReporter). Starts the app and gates rendering on boot.
 */
export function FrameworkProvider({
  app,
  children,
  splash,
  bootError,
}: FrameworkProviderProps): ReactNode {
  const { container, store } = app;
  const [i18n] = useState(() => container.get(I18nToken));

  useEffect(() => {
    void app.start().catch(() => undefined); // failures are surfaced via app.phase
    const sub = AppState.addEventListener('change', (next) => {
      store.dispatch(
        appSlice.actions.activityChanged(
          next === 'active' ? 'active' : next === 'background' ? 'background' : 'inactive',
        ),
      );
    });
    return () => sub.remove();
  }, [app, store]);

  return (
    <FrameworkContext.Provider value={app}>
      <ReduxProvider store={store.store}>
        <ContainerProvider container={container}>
          <I18nProvider i18n={i18n}>
            <ThemedShell app={app} splash={splash} bootError={bootError}>
              {children}
            </ThemedShell>
          </I18nProvider>
        </ContainerProvider>
      </ReduxProvider>
    </FrameworkContext.Provider>
  );
}

interface ThemedShellProps {
  readonly app: FrameworkApp;
  readonly children: ReactNode;
  readonly splash: ReactNode | undefined;
  readonly bootError: FrameworkProviderProps['bootError'] | undefined;
}

function ThemedShell({ app, children, splash, bootError }: ThemedShellProps): ReactNode {
  const preference = useAppSelector(settingsSlice.selectors.selectThemePreference);
  const phase = useAppSelector(appSlice.selectors.selectPhase);
  const error = useAppSelector((s) => s.app.bootError);
  const [brandTheme] = useState(() => app.container.get(BrandThemeToken));
  const [overrides] = useState(() => app.container.get(UIOverridesToken));
  const retry = (): void => void app.start().catch(() => undefined);

  let content: ReactNode;
  if (phase === 'booting') {
    content = splash ?? (
      <Screen>
        <Spinner size="large" />
      </Screen>
    );
  } else if (phase === 'failed') {
    content = bootError ? (
      bootError(error ?? 'unknown', retry)
    ) : (
      <Screen>
        <ErrorState onRetry={retry} />
      </Screen>
    );
  } else {
    content = (
      <ErrorBoundary
        onError={(e, info) =>
          app.container
            .get(CrashReporterToken)
            .captureException(e, { componentStack: info.componentStack ?? '' })
        }
        fallback={(_e, reset) => (
          <Screen>
            <ErrorState onRetry={reset} />
          </Screen>
        )}
      >
        {children}
      </ErrorBoundary>
    );
  }

  return (
    <ThemeProvider brandTheme={brandTheme} preference={preference}>
      <UIProvider components={overrides}>{content}</UIProvider>
    </ThemeProvider>
  );
}
