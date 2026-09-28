import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Container, Resolver } from './container';
import type { Token } from './token';

const ContainerContext = createContext<Resolver | null>(null);

export interface ContainerProviderProps {
  readonly container: Resolver;
  readonly children: ReactNode;
}

export function ContainerProvider({ container, children }: ContainerProviderProps): ReactNode {
  return <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>;
}

export function useResolver(): Resolver {
  const resolver = useContext(ContainerContext);
  if (!resolver)
    throw new Error('useResolver must be used inside <ContainerProvider> / <FrameworkProvider>');
  return resolver;
}

/** Resolves a dependency once per component instance (stable across renders). */
export function useInject<T>(token: Token<T>): T {
  const resolver = useResolver();
  return useMemo(() => resolver.get(token), [resolver, token]);
}

export function useOptionalInject<T>(token: Token<T>): T | undefined {
  const resolver = useResolver();
  return useMemo(() => resolver.tryGet(token), [resolver, token]);
}

/** Creates a child scope for a subtree (e.g. a feature flow) — disposed by the caller. */
export function useScope(parent: Container): Container {
  return useMemo(() => parent.createScope(), [parent]);
}
