import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '@org/theme';
import { DefaultBox } from '../atoms/Box';
import { DefaultText } from '../atoms/Text';

export interface ListItemProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly left?: ReactNode;
  readonly right?: ReactNode;
  readonly onPress?: () => void;
  readonly testID?: string;
}

export function DefaultListItem({
  title,
  subtitle,
  left,
  right,
  onPress,
  testID,
}: ListItemProps): ReactNode {
  const t = useTheme();
  const content = (
    <DefaultBox
      row
      align="center"
      gap="md"
      paddingX="lg"
      paddingY="md"
      style={{ minHeight: t.sizes.touchTarget + 12 }}
    >
      {left}
      <DefaultBox flex={1} gap="xxs">
        <DefaultText variant="bodyStrong" numberOfLines={1}>
          {title}
        </DefaultText>
        {subtitle ? (
          <DefaultText variant="caption" color="onSurfaceMuted" numberOfLines={2}>
            {subtitle}
          </DefaultText>
        ) : null}
      </DefaultBox>
      {right}
    </DefaultBox>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      {...(testID ? { testID } : {})}
      style={({ pressed }) => ({ opacity: pressed ? t.opacity.pressed : 1 })}
    >
      {content}
    </Pressable>
  );
}
