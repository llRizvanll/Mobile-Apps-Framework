import { createGraphQLClient, createHttpClient, gql, type HttpRequest } from '../index';

interface UserData {
  user: { id: string; name: string };
}

describe('GraphQLClient', () => {
  const setup = (payload: unknown) => {
    const requests: HttpRequest[] = [];
    const http = createHttpClient({
      baseUrl: 'https://api.test',
      transport: (req) => {
        requests.push(req);
        return Promise.resolve({ status: 200, headers: {}, data: payload, request: req });
      },
    });
    return { client: createGraphQLClient(http, '/graphql'), requests };
  };

  const GetUser = gql<UserData, { id: string }>`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
      }
    }
  `;

  it('sends operationName + variables and returns typed data', async () => {
    const { client, requests } = setup({ data: { user: { id: '1', name: 'Ada' } } });
    const res = await client.query(GetUser, { id: '1' });
    expect(res.ok && res.value.user.name).toBe('Ada');
    expect(requests[0]?.body).toMatchObject({ operationName: 'GetUser', variables: { id: '1' } });
    expect(requests[0]?.meta.operation).toBe('gql GetUser');
  });

  it('maps GraphQL errors and honours errorPolicy', async () => {
    const payload = {
      data: { user: { id: '1', name: 'Ada' } },
      errors: [{ message: 'partial', extensions: { code: 'X' } }],
    };
    const { client } = setup(payload);
    const strict = await client.query(GetUser, { id: '1' });
    expect(!strict.ok && strict.error.code).toBe('graphql');
    const lenient = await client.query(GetUser, { id: '1' }, { errorPolicy: 'all' });
    expect(lenient.ok).toBe(true);
  });

  it('flags UNAUTHENTICATED errors as unauthorized', async () => {
    const { client } = setup({
      data: null,
      errors: [{ message: 'no', extensions: { code: 'UNAUTHENTICATED' } }],
    });
    const res = await client.mutate(GetUser, { id: '1' });
    expect(!res.ok && res.error.code).toBe('unauthorized');
  });
});
