import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme, type SpacingToken } from '@framework/theme';

export interface ScreenProps {
  readonly children: ReactNode;
  readonly scroll?: boolean;
  readonly padding?: SpacingToken;
  /** Safe-area insets — pass from react-native-safe-area-context (kept out of the framework's deps). */
  readonly insets?: { top: number; bottom: number; left: number; right: number };
  readonly footer?: ReactNode;
  readonly testID?: string;
  readonly contentStyle?: ViewStyle;
}

/** Page template: background, status bar, keyboard avoidance, optional scroll and sticky footer. */
export function DefaultScreen({
  children,
  scroll = false,
  padding = 'lg',
  insets,
  footer,
  testID,
  contentStyle,
}: ScreenProps): ReactNode {
  const t = useTheme();
  const pad = t.spacing[padding];
  const content: ViewStyle = { padding: pad, gap: t.spacing.md, ...contentStyle };
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.colors.background,
        paddingTop: insets?.top ?? 0,
        paddingLeft: insets?.left ?? 0,
        paddingRight: insets?.right ?? 0,
      }}
      {...(testID ? { testID } : {})}
    >
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView contentContainerStyle={content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, content]}>{children}</View>
        )}
        {footer ? (
          <View style={{ padding: pad, paddingBottom: pad + (insets?.bottom ?? 0) }}>{footer}</View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}
