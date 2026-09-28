import { Emitter, backoffDelay, type BackoffOptions, type Unsubscribe } from '@org/foundation';
import type { Logger } from '@org/observability';

/** Structural WebSocket (RN global, browser, or a test double). */
export interface WebSocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: ((event: unknown) => void) | null;
  onclose: ((event: { code: number; reason?: string }) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
}

export type WebSocketFactory = (url: string, protocols?: string | string[]) => WebSocketLike;

export type ConnectionState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface WebSocketClientOptions {
  /** Static URL or async resolver (e.g. to append a fresh auth token). */
  readonly url: string | (() => Promise<string>);
  readonly protocols?: string | string[];
  readonly factory?: WebSocketFactory;
  readonly reconnect?: {
    readonly enabled?: boolean;
    readonly maxAttempts?: number;
  } & BackoffOptions;
  /** Periodic keep-alive frame (many proxies drop idle sockets after 60s). */
  readonly heartbeat?: { readonly intervalMs: number; readonly message: () => string };
  /** Max frames buffered while disconnected. */
  readonly maxQueue?: number;
  readonly logger?: Logger;
}

type Events = { state: ConnectionState; message: unknown; error: unknown; open: undefined };

const OPEN = 1;

/**
 * Resilient WebSocket: exponential-backoff reconnect, offline send queue, heartbeat,
 * JSON helpers, and typed state/message events.
 */
export class WebSocketClient {
  private socket: WebSocketLike | undefined;
  private readonly events = new Emitter<Events>();
  private readonly queue: string[] = [];
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  private manualClose = false;
  private current: ConnectionState = 'idle';

  constructor(private readonly options: WebSocketClientOptions) {}

  get state(): ConnectionState {
    return this.current;
  }

  async connect(): Promise<void> {
    if (this.socket && (this.current === 'open' || this.current === 'connecting')) return;
    this.manualClose = false;
    this.setState(this.attempts > 0 ? 'reconnecting' : 'connecting');
    const url = typeof this.options.url === 'string' ? this.options.url : await this.options.url();
    const factory =
      this.options.factory ?? ((u, p) => new WebSocket(u, p) as unknown as WebSocketLike);
    const socket = factory(url, this.options.protocols);
    this.socket = socket;

    socket.onopen = () => {
      this.attempts = 0;
      this.setState('open');
      this.events.emit('open', undefined);
      this.flush();
      this.startHeartbeat();
    };
    socket.onmessage = (event) => {
      let payload: unknown = event.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          // non-JSON frame: deliver raw string
        }
      }
      this.events.emit('message', payload);
    };
    socket.onerror = (event) => {
      this.options.logger?.warn('ws.error', { url });
      this.events.emit('error', event);
    };
    socket.onclose = (event) => {
      this.stopHeartbeat();
      this.socket = undefined;
      if (this.manualClose) {
        this.setState('closed');
        return;
      }
      this.options.logger?.info('ws.closed', { code: event.code });
      this.scheduleReconnect();
    };
  }

  disconnect(code = 1000, reason = 'client disconnect'): void {
    this.manualClose = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    this.socket?.close(code, reason);
    this.socket = undefined;
    this.setState('closed');
  }

  /** Sends now if open, otherwise buffers (bounded) until the next successful connection. */
  send(data: string | object): void {
    const frame = typeof data === 'string' ? data : JSON.stringify(data);
    if (this.socket?.readyState === OPEN) {
      this.socket.send(frame);
      return;
    }
    this.queue.push(frame);
    const max = this.options.maxQueue ?? 100;
    if (this.queue.length > max) this.queue.splice(0, this.queue.length - max);
  }

  onMessage(handler: (payload: unknown) => void): Unsubscribe {
    return this.events.on('message', handler);
  }
  onState(handler: (state: ConnectionState) => void): Unsubscribe {
    return this.events.on('state', handler);
  }
  onOpen(handler: () => void): Unsubscribe {
    return this.events.on('open', handler);
  }

  private flush(): void {
    while (this.queue.length && this.socket?.readyState === OPEN)
      this.socket.send(this.queue.shift() as string);
  }

  private scheduleReconnect(): void {
    const { enabled = true, maxAttempts = Infinity, ...backoff } = this.options.reconnect ?? {};
    if (!enabled || this.attempts >= maxAttempts) {
      this.setState('closed');
      return;
    }
    const delay = backoffDelay(this.attempts++, { baseMs: 500, maxMs: 30_000, ...backoff });
    this.setState('reconnecting');
    this.reconnectTimer = setTimeout(() => void this.connect(), delay);
  }

  private startHeartbeat(): void {
    const hb = this.options.heartbeat;
    if (!hb) return;
    this.heartbeatTimer = setInterval(() => this.send(hb.message()), hb.intervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }

  private setState(state: ConnectionState): void {
    if (state === this.current) return;
    this.current = state;
    this.events.emit('state', state);
  }
}
