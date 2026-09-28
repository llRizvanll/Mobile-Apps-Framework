import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { resolveTheme } from './create';
import { defaultBrandTheme } from './defaults';
import type { BrandTheme, ColorScheme, Theme } from './tokens';

export type ThemePreference = 'system' | ColorScheme;

const ThemeContext = createContext<Theme>(resolveTheme(defaultBrandTheme, 'light'));

export interface ThemeProviderProps {
  readonly brandTheme: BrandTheme;
  readonly preference?: ThemePreference;
  readonly children: ReactNode;
}

export function ThemeProvider({
  brandTheme,
  preference = 'system',
  children,
}: ThemeProviderProps): ReactNode {
  const system = useColorScheme();
  const scheme: ColorScheme =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const theme = useMemo(() => resolveTheme(brandTheme, scheme), [brandTheme, scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): Theme => useContext(ThemeContext);

type NamedStyles<T> = { [P in keyof T]: StyleSheet.NamedStyles<T>[P] };

/**
 * Theme-aware, memoised styles:
 *   const useStyles = makeStyles((t) => ({ root: { padding: t.spacing.lg } }));
 */
export function makeStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T): () => T {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
