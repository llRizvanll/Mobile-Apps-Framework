import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import { useTranslation, type TranslationKey } from '@framework/i18n';
import { useTheme, type ColorTokens } from '@framework/theme';
import { DefaultSpinner } from './Spinner';
import { DefaultText } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  readonly title?: string;
  readonly tx?: TranslationKey;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  readonly left?: ReactNode;
  readonly style?: ViewStyle;
}

const palette: Record<
  ButtonVariant,
  { bg: keyof ColorTokens | null; fg: keyof ColorTokens; border: keyof ColorTokens | null }
> = {
  primary: { bg: 'primary', fg: 'onPrimary', border: null },
  secondary: { bg: 'primaryContainer', fg: 'onPrimaryContainer', border: null },
  outline: { bg: null, fg: 'primary', border: 'border' },
  ghost: { bg: null, fg: 'primary', border: null },
  danger: { bg: 'danger', fg: 'onDanger', border: null },
};

export function DefaultButton({
  title,
  tx,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth,
  left,
  disabled,
  style,
  ...rest
}: ButtonProps): ReactNode {
  const t = useTheme();
  const { t: translate } = useTranslation();
  const p = palette[variant];
  const isDisabled = disabled === true || loading;
  const label = tx ? translate(tx) : title;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...(label ? { accessibilityLabel: label } : {})}
      disabled={isDisabled}
      hitSlop={8}
      style={({ pressed }) => [
        {
          minHeight: Math.max(
            t.components.button.height[size],
            size === 'sm' ? 0 : t.sizes.touchTarget,
          ),
          paddingHorizontal: t.spacing[size === 'sm' ? 'md' : 'lg'],
          borderRadius: t.radii[t.components.button.radius],
          backgroundColor: p.bg ? t.colors[p.bg] : 'transparent',
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border ? t.colors[p.border] : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.spacing.sm,
          opacity: isDisabled ? t.opacity.disabled : pressed ? t.opacity.pressed : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
      {...rest}
    >
      {loading ? <DefaultSpinner color={p.fg} /> : left}
      {label ? (
        <DefaultText variant="label" color={p.fg}>
          {label}
        </DefaultText>
      ) : null}
    </Pressable>
  );
}
