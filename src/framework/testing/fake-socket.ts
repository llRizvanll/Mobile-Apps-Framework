import type { WebSocketFactory, WebSocketLike } from '@framework/network';

/** Controllable WebSocket double: `open()`, `receive(msg)`, `drop()`; inspects `sent`. */
export class FakeWebSocket implements WebSocketLike {
  readyState = 0;
  readonly sent: unknown[] = [];
  onopen: WebSocketLike['onopen'] = null;
  onclose: WebSocketLike['onclose'] = null;
  onmessage: WebSocketLike['onmessage'] = null;
  onerror: WebSocketLike['onerror'] = null;
  constructor(
    readonly url: string,
    readonly protocols?: string | string[],
  ) {}
  send(data: string): void {
    try {
      this.sent.push(JSON.parse(data));
    } catch {
      this.sent.push(data);
    }
  }
  close(code = 1000): void {
    this.readyState = 3;
    this.onclose?.({ code });
  }
  open(): void {
    this.readyState = 1;
    this.onopen?.({});
  }
  receive(message: unknown): void {
    this.onmessage?.({ data: typeof message === 'string' ? message : JSON.stringify(message) });
  }
  drop(code = 1006): void {
    this.readyState = 3;
    this.onclose?.({ code });
  }
}

export function createFakeSocketFactory(): { factory: WebSocketFactory; sockets: FakeWebSocket[] } {
  const sockets: FakeWebSocket[] = [];
  return {
    sockets,
    factory: (url, protocols) => {
      const s = new FakeWebSocket(url, protocols);
      sockets.push(s);
      return s;
    },
  };
}
