/**
 * Global state shape, assembled by declaration merging. Every slice (shell or feature) augments
 * this interface, so `RootState` and `useAppSelector` are fully typed without a central file:
 *
 *   declare module '@framework/state' {
 *     interface RootStateRegistry { todos: TodosState }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RootStateRegistry {}

export type RootState = RootStateRegistry;
