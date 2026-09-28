import {
  AppError,
  Emitter,
  createObservableStore,
  type ReadableStore,
  type Unsubscribe,
} from '@org/foundation';

export interface MviContext<S, I, E> {
  readonly getState: () => S;
  readonly dispatch: (intent: I) => void;
  /** One-off events for the view (navigate, toast, haptics) — not part of state. */
  readonly emit: (effect: E) => void;
  readonly signal: AbortSignal;
}

export interface MviSpec<S, I, E = never> {
  readonly initialState: S;
  /** Pure state transition. Must not perform side effects. */
  readonly reduce: (state: S, intent: I) => S;
  /** Side effects triggered by intents; dispatch follow-up intents with results. */
  readonly effects?: (intent: I, ctx: MviContext<S, I, E>) => void | Promise<void>;
  readonly onError?: (error: AppError, intent: I) => void;
  /** Observe every transition — logging, analytics, AI session traces, time-travel. */
  readonly onTransition?: (prev: S, intent: I, next: S) => void;
}

/**
 * Unidirectional MVI store: View → Intent → reduce → State → View, with side effects producing
 * further intents. Deterministic and replayable, which makes it ideal for complex flows.
 */
export class MviStore<S, I, E = never> implements ReadableStore<S> {
  private readonly store;
  private readonly effectsBus = new Emitter<{ effect: E }>();
  private readonly controller = new AbortController();
  private readonly ctx: MviContext<S, I, E>;

  constructor(private readonly spec: MviSpec<S, I, E>) {
    this.store = createObservableStore(spec.initialState);
    this.ctx = {
      getState: this.getState,
      dispatch: (i) => this.dispatch(i),
      emit: (e) => this.effectsBus.emit('effect', e),
      signal: this.controller.signal,
    };
  }

  readonly getState = (): S => this.store.getState();
  readonly subscribe = (listener: () => void): Unsubscribe => this.store.subscribe(listener);

  dispatch(intent: I): void {
    if (this.controller.signal.aborted) return;
    const prev = this.store.getState();
    const next = this.spec.reduce(prev, intent);
    this.store.setState(next);
    this.spec.onTransition?.(prev, intent, next);
    if (!this.spec.effects) return;
    try {
      const pending = this.spec.effects(intent, this.ctx);
      if (pending) pending.catch((e: unknown) => this.fail(e, intent));
    } catch (e) {
      this.fail(e, intent);
    }
  }

  onEffect(listener: (effect: E) => void): Unsubscribe {
    return this.effectsBus.on('effect', listener);
  }

  dispose(): void {
    this.controller.abort();
    this.effectsBus.clear();
  }

  private fail(error: unknown, intent: I): void {
    if (this.controller.signal.aborted) return;
    this.spec.onError?.(AppError.from(error), intent);
  }
}

export const createMviStore = <S, I, E = never>(spec: MviSpec<S, I, E>): MviStore<S, I, E> =>
  new MviStore(spec);
