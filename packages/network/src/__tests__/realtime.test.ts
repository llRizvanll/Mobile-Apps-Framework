import { GraphQLSubscriptionClient, WebSocketClient, gql, type WebSocketLike } from '../index';

class FakeSocket implements WebSocketLike {
  static instances: FakeSocket[] = [];
  readyState = 0;
  sent: unknown[] = [];
  onopen: WebSocketLike['onopen'] = null;
  onclose: WebSocketLike['onclose'] = null;
  onmessage: WebSocketLike['onmessage'] = null;
  onerror: WebSocketLike['onerror'] = null;
  constructor() {
    FakeSocket.instances.push(this);
  }
  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }
  close(): void {
    this.readyState = 3;
  }
  open(): void {
    this.readyState = 1;
    this.onopen?.({});
  }
  receive(msg: object): void {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
  drop(): void {
    this.readyState = 3;
    this.onclose?.({ code: 1006 });
  }
}

const flush = () => new Promise((r) => setImmediate(() => r(undefined)));

describe('WebSocketClient', () => {
  beforeEach(() => {
    FakeSocket.instances = [];
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });
  });
  afterEach(() => jest.useRealTimers());

  it('queues while offline, reconnects with backoff and flushes', async () => {
    const ws = new WebSocketClient({
      url: 'wss://x',
      factory: () => new FakeSocket(),
      reconnect: { baseMs: 100, jitter: 0 },
    });
    const states: string[] = [];
    ws.onState((s) => states.push(s));
    ws.send({ hello: 1 });
    await ws.connect();
    FakeSocket.instances[0]?.open();
    expect(FakeSocket.instances[0]?.sent).toEqual([{ hello: 1 }]);
    FakeSocket.instances[0]?.drop();
    ws.send({ queued: true });
    jest.advanceTimersByTime(100);
    await flush();
    FakeSocket.instances[1]?.open();
    expect(FakeSocket.instances[1]?.sent).toEqual([{ queued: true }]);
    expect(states).toEqual(['connecting', 'open', 'reconnecting', 'open']);
    ws.disconnect();
    expect(ws.state).toBe('closed');
  });

  it('runs graphql-ws handshake and resubscribes after reconnect', async () => {
    const ws = new WebSocketClient({
      url: 'wss://x',
      factory: () => new FakeSocket(),
      reconnect: { baseMs: 10, jitter: 0 },
    });
    const gqlws = new GraphQLSubscriptionClient(ws, () => ({ token: 't' }));
    const next = jest.fn();
    const OnMessage = gql<{ message: string }, { room: string }>`
      subscription OnMessage($room: ID!) {
        message(room: $room)
      }
    `;
    gqlws.subscribe(OnMessage, { room: 'r1' }, { next });
    await flush();
    const s1 = FakeSocket.instances[0]!;
    s1.open();
    await flush();
    expect(s1.sent[0]).toEqual({ type: 'connection_init', payload: { token: 't' } });
    s1.receive({ type: 'connection_ack' });
    const sub = s1.sent[1] as { id: string; type: string; payload: { operationName: string } };
    expect(sub.type).toBe('subscribe');
    expect(sub.payload.operationName).toBe('OnMessage');
    s1.receive({ type: 'next', id: sub.id, payload: { data: { message: 'hi' } } });
    expect(next).toHaveBeenCalledWith({ message: 'hi' });

    s1.drop();
    jest.advanceTimersByTime(10);
    await flush();
    const s2 = FakeSocket.instances[1]!;
    s2.open();
    await flush();
    s2.receive({ type: 'connection_ack' });
    expect(s2.sent.map((m) => (m as { type: string }).type)).toEqual([
      'connection_init',
      'subscribe',
    ]);
    ws.disconnect();
  });
});
