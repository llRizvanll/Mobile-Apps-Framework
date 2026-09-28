import { DefaultBox } from './atoms/Box';
import { DefaultButton } from './atoms/Button';
import { DefaultDivider } from './atoms/Divider';
import { DefaultInput } from './atoms/Input';
import { DefaultSpinner } from './atoms/Spinner';
import { DefaultText } from './atoms/Text';
import { DefaultFormField } from './molecules/FormField';
import { DefaultListItem } from './molecules/ListItem';
import { DefaultEmptyState } from './organisms/EmptyState';
import { DefaultErrorState } from './organisms/ErrorState';
import { createOverridable } from './registry';
import { DefaultScreen } from './templates/Screen';

export * from './registry';
export { ErrorBoundary, type ErrorBoundaryProps } from './organisms/ErrorBoundary';
export { frameworkTranslations } from './translations';

// Atoms
export const Box = createOverridable('Box', DefaultBox);
export const Text = createOverridable('Text', DefaultText);
export const Button = createOverridable('Button', DefaultButton);
export const Input = createOverridable('Input', DefaultInput);
export const Spinner = createOverridable('Spinner', DefaultSpinner);
export const Divider = createOverridable('Divider', DefaultDivider);
// Molecules
export const FormField = createOverridable('FormField', DefaultFormField);
export const ListItem = createOverridable('ListItem', DefaultListItem);
// Organisms
export const EmptyState = createOverridable('EmptyState', DefaultEmptyState);
export const ErrorState = createOverridable('ErrorState', DefaultErrorState);
// Templates
export const Screen = createOverridable('Screen', DefaultScreen);

// Default implementations — for brand overrides that decorate rather than replace.
export {
  DefaultBox,
  DefaultButton,
  DefaultDivider,
  DefaultEmptyState,
  DefaultErrorState,
  DefaultFormField,
  DefaultInput,
  DefaultListItem,
  DefaultScreen,
  DefaultSpinner,
  DefaultText,
};
export type { BoxProps } from './atoms/Box';
export type { ButtonProps, ButtonSize, ButtonVariant } from './atoms/Button';
export type { DividerProps } from './atoms/Divider';
export type { InputProps } from './atoms/Input';
export type { SpinnerProps } from './atoms/Spinner';
export type { TextProps } from './atoms/Text';
export type { FormFieldProps } from './molecules/FormField';
export type { ListItemProps } from './molecules/ListItem';
export type { EmptyStateProps } from './organisms/EmptyState';
export type { ErrorStateProps } from './organisms/ErrorState';
export type { ScreenProps } from './templates/Screen';
