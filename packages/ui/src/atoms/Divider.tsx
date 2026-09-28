import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, type SpacingToken } from '@org/theme';

export interface DividerProps {
  readonly spacing?: SpacingToken;
}

export function DefaultDivider({ spacing = 'none' }: DividerProps): ReactNode {
  const t = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: t.colors.divider,
        marginVertical: t.spacing[spacing],
      }}
    />
  );
}
