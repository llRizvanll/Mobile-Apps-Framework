import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from 'react';
import type { BoxProps } from './atoms/Box';
import type { ButtonProps } from './atoms/Button';
import type { DividerProps } from './atoms/Divider';
import type { InputProps } from './atoms/Input';
import type { SpinnerProps } from './atoms/Spinner';
import type { TextProps } from './atoms/Text';
import type { FormFieldProps } from './molecules/FormField';
import type { ListItemProps } from './molecules/ListItem';
import type { EmptyStateProps } from './organisms/EmptyState';
import type { ErrorStateProps } from './organisms/ErrorState';
import type { ScreenProps } from './templates/Screen';

/**
 * Every overridable component. Brands (or apps) replace entries through `<UIProvider components>`.
 * Add custom slots via declaration merging:
 *   declare module '@framework/ui' { interface UIComponentMap { Avatar: ComponentType<AvatarProps> } }
 */
export interface UIComponentMap {
  Box: ComponentType<BoxProps>;
  Text: ComponentType<TextProps>;
  Button: ComponentType<ButtonProps>;
  Input: ComponentType<InputProps>;
  Spinner: ComponentType<SpinnerProps>;
  Divider: ComponentType<DividerProps>;
  FormField: ComponentType<FormFieldProps>;
  ListItem: ComponentType<ListItemProps>;
  EmptyState: ComponentType<EmptyStateProps>;
  ErrorState: ComponentType<ErrorStateProps>;
  Screen: ComponentType<ScreenProps>;
}

export type UIOverrides = Partial<UIComponentMap>;

const UIContext = createContext<UIOverrides>({});

export function UIProvider({
  components,
  children,
}: {
  readonly components?: UIOverrides;
  readonly children: ReactNode;
}): ReactNode {
  const parent = useContext(UIContext);
  const merged = useMemo(() => ({ ...parent, ...components }), [parent, components]);
  return <UIContext.Provider value={merged}>{children}</UIContext.Provider>;
}

export const useUIOverrides = (): UIOverrides => useContext(UIContext);

/**
 * Wraps a default implementation so a brand override (if registered) renders instead.
 * Overrides that want to decorate the default must use the exported `Default*` component,
 * not the overridable one (which would recurse).
 */
export function createOverridable<K extends keyof UIComponentMap>(
  name: K,
  Default: UIComponentMap[K],
): UIComponentMap[K] {
  type P = UIComponentMap[K] extends ComponentType<infer X> ? X : never;
  function Overridable(props: P): ReactNode {
    const Impl = (useContext(UIContext)[name] ?? Default) as ComponentType<P>;
    return <Impl {...(props as P & object)} />;
  }
  Overridable.displayName = name;
  return Overridable as unknown as UIComponentMap[K];
}
