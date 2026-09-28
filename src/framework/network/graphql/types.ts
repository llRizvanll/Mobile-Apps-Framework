import { AppError } from '@framework/foundation';

/**
 * Typed GraphQL document. Compatible with graphql-codegen's `documentMode: 'string'` output
 * (`TypedDocumentString`) so result/variable types flow from the schema with zero runtime deps.
 */
// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types -- must match graphql-codegen's String subclass
export interface TypedDocumentString<TResult, TVariables> extends String {
  readonly __apiType?: (variables: TVariables) => TResult;
}

export type GraphQLDocument<TResult = unknown, TVariables = Record<string, unknown>> =
  string | TypedDocumentString<TResult, TVariables>;

export type ResultOf<D> = D extends TypedDocumentString<infer R, unknown> ? R : unknown;
export type VariablesOf<D> =
  D extends TypedDocumentString<unknown, infer V> ? V : Record<string, unknown>;

/** Tag helper for hand-written documents: `gql<Data, Vars>\`query { ... }\``. */
export const gql = <TResult = unknown, TVariables = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: readonly unknown[]
): TypedDocumentString<TResult, TVariables> =>
  strings.reduce((acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ''), '');

export interface GraphQLErrorEntry {
  readonly message: string;
  readonly path?: readonly (string | number)[];
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export interface GraphQLResponse<T> {
  readonly data?: T | null;
  readonly errors?: readonly GraphQLErrorEntry[];
}

export class GraphQLError extends AppError {
  readonly errors: readonly GraphQLErrorEntry[];
  constructor(errors: readonly GraphQLErrorEntry[], operationName?: string) {
    const unauth = errors.some((e) => e.extensions?.['code'] === 'UNAUTHENTICATED');
    super(
      unauth ? 'unauthorized' : 'graphql',
      errors.map((e) => e.message).join('; ') || 'GraphQL error',
      {
        meta: { operationName, codes: errors.map((e) => e.extensions?.['code']).filter(Boolean) },
      },
    );
    this.name = 'GraphQLError';
    this.errors = errors;
  }
}

export const operationNameOf = (document: string): string | undefined =>
  /\b(?:query|mutation|subscription)\s+([_A-Za-z][_0-9A-Za-z]*)/.exec(document)?.[1];
