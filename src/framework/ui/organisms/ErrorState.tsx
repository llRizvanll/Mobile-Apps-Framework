import type { ReactNode } from 'react';
import { useTranslation } from '@framework/i18n';
import { DefaultEmptyState } from './EmptyState';

export interface ErrorStateProps {
  readonly error?: unknown;
  readonly title?: string;
  readonly onRetry?: () => void;
}

/** Friendly error surface. Uses `framework.error.*` keys, overridable per brand. */
export function DefaultErrorState({ error, title, onRetry }: ErrorStateProps): ReactNode {
  const { i18n } = useTranslation();
  const key = (error as { userMessageKey?: string } | undefined)?.userMessageKey;
  const message = key && i18n.exists(key) ? i18n.t(key) : i18n.t('framework.error.generic');
  return (
    <DefaultEmptyState
      title={title ?? i18n.t('framework.error.title')}
      message={message}
      {...(onRetry ? { onAction: onRetry, actionLabel: i18n.t('framework.action.retry') } : {})}
    />
  );
}
