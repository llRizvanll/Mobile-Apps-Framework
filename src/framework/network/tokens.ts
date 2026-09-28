import { createToken } from '@framework/di';
import type { GraphQLClient } from './graphql/client';
import type { GraphQLSubscriptionClient } from './graphql/subscriptions';
import type { AccessTokenProvider, AuthRefreshPort } from './http/auth';
import type { HttpClient } from './http/client';
import type { HttpMiddleware } from './http/middleware';
import type { HttpTransport } from './http/transport';
import type { WebSocketClient, WebSocketFactory } from './realtime/websocket';

export const HttpClientToken = createToken<HttpClient>('network.HttpClient');
export const HttpTransportToken = createToken<HttpTransport>('network.HttpTransport');
/** Multi-binding: modules contribute middleware (inserted after framework auth/retry). */
export const HttpMiddlewareToken = createToken<HttpMiddleware>('network.HttpMiddleware[]');
export const GraphQLClientToken = createToken<GraphQLClient>('network.GraphQLClient');
export const GraphQLSubscriptionClientToken = createToken<GraphQLSubscriptionClient>(
  'network.GraphQLSubscriptionClient',
);
export const WebSocketClientToken = createToken<WebSocketClient>('network.WebSocketClient');
export const WebSocketFactoryToken = createToken<WebSocketFactory>('network.WebSocketFactory');
/** Ports the app (usually an auth feature module) must bind for authenticated APIs. */
export const AccessTokenProviderToken = createToken<AccessTokenProvider>(
  'network.AccessTokenProvider',
);
export const AuthRefreshPortToken = createToken<AuthRefreshPort>('network.AuthRefreshPort');
