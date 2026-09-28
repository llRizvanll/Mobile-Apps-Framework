/**
 * A typed identifier for a dependency. The phantom `__type` field carries `T` through the type
 * system so `container.get(token)` is fully inferred — no decorators or reflect-metadata needed.
 */
export interface Token<T> {
  readonly key: symbol;
  readonly description: string;
  /** Phantom type carrier. Never set at runtime. */
  readonly __type?: T;
}

export const createToken = <T>(description: string): Token<T> =>
  Object.freeze({ key: Symbol(description), description });

export type TokenType<K> = K extends Token<infer T> ? T : never;

export type TokenTypes<D extends readonly Token<unknown>[]> = {
  -readonly [K in keyof D]: TokenType<D[K]>;
};
