import type { ReactNode } from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTranslation, type TranslateParams, type TranslationKey } from '@framework/i18n';
import { useTheme, type ColorTokens, type TypographyVariant } from '@framework/theme';

export interface TextProps extends RNTextProps {
  readonly variant?: TypographyVariant;
  readonly color?: keyof ColorTokens;
  readonly align?: TextStyle['textAlign'];
  /** Translation key — preferred over raw children for user-facing copy. */
  readonly tx?: TranslationKey;
  readonly txParams?: TranslateParams;
  readonly children?: ReactNode;
}

export function DefaultText({
  variant = 'body',
  color = 'onSurface',
  align,
  tx,
  txParams,
  style,
  children,
  ...rest
}: TextProps): ReactNode {
  const t = useTheme();
  const { t: translate } = useTranslation();
  const token = t.typography[variant];
  const family =
    token.fontFamily ?? (Number(token.fontWeight) >= 600 ? t.fonts.bold : t.fonts.regular);
  const base: TextStyle = {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    fontWeight: token.fontWeight,
    color: t.colors[color],
    writingDirection: 'auto',
    ...(token.letterSpacing !== undefined && { letterSpacing: token.letterSpacing }),
    ...(family && { fontFamily: family }),
    ...(align && { textAlign: align }),
  };
  return (
    <RNText style={[base, style]} maxFontSizeMultiplier={1.6} {...rest}>
      {tx ? translate(tx, txParams) : children}
    </RNText>
  );
}
