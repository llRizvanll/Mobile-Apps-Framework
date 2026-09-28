import type { ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import {
  useTheme,
  type ColorTokens,
  type ElevationToken,
  type RadiusToken,
  type SpacingToken,
} from '@org/theme';

export interface BoxProps extends ViewProps {
  readonly padding?: SpacingToken;
  readonly paddingX?: SpacingToken;
  readonly paddingY?: SpacingToken;
  readonly margin?: SpacingToken;
  readonly gap?: SpacingToken;
  readonly background?: keyof ColorTokens;
  readonly radius?: RadiusToken;
  readonly elevation?: ElevationToken;
  readonly row?: boolean;
  readonly align?: ViewStyle['alignItems'];
  readonly justify?: ViewStyle['justifyContent'];
  readonly flex?: number;
  readonly children?: ReactNode;
}

/** Layout primitive driven exclusively by theme tokens. */
export function DefaultBox({
  padding,
  paddingX,
  paddingY,
  margin,
  gap,
  background,
  radius,
  elevation,
  row,
  align,
  justify,
  flex,
  style,
  ...rest
}: BoxProps): ReactNode {
  const t = useTheme();
  const s: ViewStyle = {
    ...(padding && { padding: t.spacing[padding] }),
    ...(paddingX && { paddingHorizontal: t.spacing[paddingX] }),
    ...(paddingY && { paddingVertical: t.spacing[paddingY] }),
    ...(margin && { margin: t.spacing[margin] }),
    ...(gap && { gap: t.spacing[gap] }),
    ...(background && { backgroundColor: t.colors[background] }),
    ...(radius && { borderRadius: t.radii[radius] }),
    ...(elevation && t.elevation[elevation]),
    ...(row && { flexDirection: 'row' }),
    ...(align && { alignItems: align }),
    ...(justify && { justifyContent: justify }),
    ...(flex !== undefined && { flex }),
  };
  return <View style={[s, style]} {...rest} />;
}
