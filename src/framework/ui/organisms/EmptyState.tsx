import type { ReactNode } from 'react';
import { DefaultBox } from '../atoms/Box';
import { DefaultButton } from '../atoms/Button';
import { DefaultText } from '../atoms/Text';

export interface EmptyStateProps {
  readonly title: string;
  readonly message?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly illustration?: ReactNode;
}

export function DefaultEmptyState({
  title,
  message,
  actionLabel,
  onAction,
  illustration,
}: EmptyStateProps): ReactNode {
  return (
    <DefaultBox flex={1} align="center" justify="center" padding="xl" gap="md">
      {illustration}
      <DefaultText variant="title" align="center" accessibilityRole="header">
        {title}
      </DefaultText>
      {message ? (
        <DefaultText color="onSurfaceMuted" align="center">
          {message}
        </DefaultText>
      ) : null}
      {actionLabel && onAction ? (
        <DefaultButton title={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </DefaultBox>
  );
}
