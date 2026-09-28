export type Unsubscribe = () => void;

export interface Disposable {
  dispose(): void | Promise<void>;
}

export const isDisposable = (value: unknown): value is Disposable =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Disposable).dispose === 'function';

/** Nominal typing: `type UserId = Branded<string, 'UserId'>`. */
declare const brandSymbol: unique symbol;
export type Branded<T, B extends string> = T & { readonly [brandSymbol]: B };

export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? readonly U[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

/** Structural schema port: satisfied by zod, valibot, yup, or a hand-written guard. */
export interface Parser<T> {
  parse(input: unknown): T;
}

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
