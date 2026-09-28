import { useState, type ReactNode } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '@framework/theme';

export interface InputProps extends TextInputProps {
  readonly invalid?: boolean;
}

export function DefaultInput({
  invalid,
  style,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}: InputProps): ReactNode {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const c = t.components.input;
  return (
    <TextInput
      placeholderTextColor={t.colors.onSurfaceMuted}
      editable={editable}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        {
          minHeight: c.height,
          borderWidth: focused ? c.borderWidth + 1 : c.borderWidth,
          borderRadius: t.radii[c.radius],
          borderColor: invalid ? t.colors.danger : focused ? t.colors.focus : t.colors.border,
          paddingHorizontal: t.spacing.md,
          color: t.colors.onSurface,
          backgroundColor: t.colors.surface,
          fontSize: t.typography.body.fontSize,
          opacity: editable ? 1 : t.opacity.disabled,
          textAlign: 'auto',
        },
        style,
      ]}
      {...rest}
    />
  );
}
