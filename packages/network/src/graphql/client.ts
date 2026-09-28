import { err, ok, type Result, type AppError } from '@org/foundation';
import type { HttpClient } from '../http/client';
import type { RequestOptions } from '../http/types';
import { GraphQLError, operationNameOf, type GraphQLDocument, type GraphQLResponse } from './types';

export interface GraphQLRequestOptions extends Omit<RequestOptions, 'parser'> {
  /** 'none' (default): any error → Err. 'all': return data when present despite partial errors. */
  readonly errorPolicy?: 'none' | 'all';
}

export interface GraphQLClient {
  query<TResult, TVariables = Record<string, unknown>>(
    document: GraphQLDocument<TResult, TVariables>,
    variables?: TVariables,
    options?: GraphQLRequestOptions,
  ): Promise<Result<TResult, AppError>>;
  mutate<TResult, TVariables = Record<string, unknown>>(
    document: GraphQLDocument<TResult, TVariables>,
    variables?: TVariables,
    options?: GraphQLRequestOptions,
  ): Promise<Result<TResult, AppError>>;
}

/**
 * GraphQL over the shared `HttpClient`, so auth refresh, retries, tracing and logging apply
 * uniformly to REST and GraphQL. Mutations are never retried automatically.
 */
export function createGraphQLClient(http: HttpClient, endpoint: string): GraphQLClient {
  const execute = async <TResult>(
    kind: 'query' | 'mutation',
    document: GraphQLDocument<TResult, never>,
    variables: unknown,
    options: GraphQLRequestOptions = {},
  ): Promise<Result<TResult, AppError>> => {
    const query = document.toString();
    const operationName = operationNameOf(query);
    const { errorPolicy = 'none', ...rest } = options;
    const res = await http.post<GraphQLResponse<TResult>>(
      endpoint,
      { query, variables: variables ?? {}, ...(operationName ? { operationName } : {}) },
      {
        ...rest,
        meta: {
          operation: `gql ${operationName ?? kind}`,
          ...(kind === 'mutation' ? { retry: false } : { retry: 2 }),
          ...rest.meta,
        },
      },
    );
    if (!res.ok) return res;
    const { data, errors } = res.value.data;
    if (errors?.length && (errorPolicy === 'none' || data == null))
      return err(new GraphQLError(errors, operationName));
    if (data == null)
      return err(new GraphQLError([{ message: 'Empty GraphQL response' }], operationName));
    return ok(data);
  };

  return {
    query: (d, v, o) => execute('query', d as GraphQLDocument<never, never>, v, o),
    mutate: (d, v, o) => execute('mutation', d as GraphQLDocument<never, never>, v, o),
  };
}
