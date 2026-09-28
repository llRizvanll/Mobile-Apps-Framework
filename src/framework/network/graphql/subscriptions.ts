import { createId, type Unsubscribe } from '@framework/foundation';
import type { WebSocketClient } from '../realtime/websocket';
import {
  GraphQLError,
  operationNameOf,
  type GraphQLDocument,
  type GraphQLErrorEntry,
} from './types';

export interface SubscriptionObserver<T> {
  next(data: T): void;
  error?(error: GraphQLError): void;
  complete?(): void;
}

type Incoming =
  | { type: 'connection_ack' }
  | { type: 'ping' | 'pong'; payload?: unknown }
  | { type: 'next'; id: string; payload: { data?: unknown; errors?: GraphQLErrorEntry[] } }
  | { type: 'error'; id: string; payload: GraphQLErrorEntry[] }
  | { type: 'complete'; id: string };

interface Active {
  readonly payload: { query: string; variables: unknown; operationName?: string };
  readonly observer: SubscriptionObserver<unknown>;
}

/**
 * GraphQL subscriptions using the `graphql-transport-ws` protocol (graphql-ws), layered on the
 * resilient `WebSocketClient`. Active subscriptions are re-established after every reconnect.
 */
export class GraphQLSubscriptionClient {
  private readonly active = new Map<string, Active>();
  private acknowledged = false;

  constructor(
    private readonly ws: WebSocketClient,
    private readonly connectionParams: () =>
      Promise<Record<string, unknown>> | Record<string, unknown> = () => ({}),
  ) {
    ws.onOpen(() => {
      this.acknowledged = false;
      void Promise.resolve(this.connectionParams()).then((payload) =>
        ws.send({ type: 'connection_init', payload }),
      );
    });
    ws.onMessage((raw) => this.handle(raw as Incoming));
  }

  subscribe<TResult, TVariables>(
    document: GraphQLDocument<TResult, TVariables>,
    variables: TVariables,
    observer: SubscriptionObserver<TResult>,
  ): Unsubscribe {
    const id = createId('sub_');
    const query = document.toString();
    const operationName = operationNameOf(query);
    const entry: Active = {
      payload: { query, variables, ...(operationName ? { operationName } : {}) },
      observer: observer,
    };
    this.active.set(id, entry);
    if (this.acknowledged) this.ws.send({ id, type: 'subscribe', payload: entry.payload });
    else if (this.ws.state === 'idle' || this.ws.state === 'closed') void this.ws.connect();
    return () => {
      if (!this.active.delete(id)) return;
      if (this.acknowledged) this.ws.send({ id, type: 'complete' });
    };
  }

  private handle(msg: Incoming): void {
    switch (msg.type) {
      case 'connection_ack':
        this.acknowledged = true;
        for (const [id, a] of this.active)
          this.ws.send({ id, type: 'subscribe', payload: a.payload });
        return;
      case 'ping':
        this.ws.send({ type: 'pong' });
        return;
      case 'pong':
        return;
      case 'next': {
        const a = this.active.get(msg.id);
        if (!a) return;
        if (msg.payload.errors?.length) a.observer.error?.(new GraphQLError(msg.payload.errors));
        else a.observer.next(msg.payload.data);
        return;
      }
      case 'error':
        this.active.get(msg.id)?.observer.error?.(new GraphQLError(msg.payload));
        this.active.delete(msg.id);
        return;
      case 'complete':
        this.active.get(msg.id)?.observer.complete?.();
        this.active.delete(msg.id);
        return;
    }
  }
}
