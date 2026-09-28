import type { ReactNode } from 'react';
import type { TranslationKey } from '@org/i18n';
import { DefaultBox } from '../atoms/Box';
import { DefaultInput, type InputProps } from '../atoms/Input';
import { DefaultText } from '../atoms/Text';

export interface FormFieldProps extends InputProps {
  readonly label?: string;
  readonly labelTx?: TranslationKey;
  readonly error?: string | null;
  readonly hint?: string;
}

export function DefaultFormField({
  label,
  labelTx,
  error,
  hint,
  testID,
  ...input
}: FormFieldProps): ReactNode {
  return (
    <DefaultBox gap="xs">
      {label || labelTx ? (
        <DefaultText variant="label" {...(labelTx ? { tx: labelTx } : {})}>
          {label}
        </DefaultText>
      ) : null}
      <DefaultInput
        invalid={!!error}
        accessibilityLabel={label}
        {...(testID ? { testID } : {})}
        {...input}
      />
      {error ? (
        <DefaultText
          variant="caption"
          color="danger"
          accessibilityLiveRegion="polite"
          {...(testID ? { testID: `${testID}.error` } : {})}
        >
          {error}
        </DefaultText>
      ) : hint ? (
        <DefaultText variant="caption" color="onSurfaceMuted">
          {hint}
        </DefaultText>
      ) : null}
    </DefaultBox>
  );
}
