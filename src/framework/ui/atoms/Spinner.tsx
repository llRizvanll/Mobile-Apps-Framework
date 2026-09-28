import type { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme, type ColorTokens } from '@framework/theme';

export interface SpinnerProps {
  readonly size?: 'small' | 'large';
  readonly color?: keyof ColorTokens;
  readonly testID?: string;
}

export function DefaultSpinner({
  size = 'small',
  color = 'primary',
  testID,
}: SpinnerProps): ReactNode {
  const t = useTheme();
  return (
    <ActivityIndicator
      size={size}
      color={t.colors[color]}
      accessibilityLabel="loading"
      {...(testID ? { testID } : {})}
    />
  );
}
