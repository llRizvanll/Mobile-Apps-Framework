import {
  AppError,
  createObservableStore,
  type ReadableStore,
  type Unsubscribe,
  type WritableStore,
} from '@framework/foundation';

/**
 * MVVM base class. Holds screen state, exposes commands as methods, and is completely
 * React-free — test it with plain unit tests. Bind to UI with `useViewModel`.
 *
 *   class LoginViewModel extends ViewModel<LoginState> {
 *     constructor(private readonly login: LoginUseCase) { super({ email: '', busy: false }); }
 *     submit = () => this.launch(async () => { ... });
 *   }
 */
export abstract class ViewModel<S extends object> implements ReadableStore<S> {
  private readonly store: WritableStore<S>;
  private readonly cleanups: (() => void)[] = [];
  private controller = new AbortController();
  private refs = 0;
  private initialised = false;
  private pendingDispose: ReturnType<typeof setTimeout> | undefined;
  private disposedFlag = false;

  protected constructor(initialState: S) {
    this.store = createObservableStore(initialState);
  }

  get state(): S {
    return this.store.getState();
  }

  get disposed(): boolean {
    return this.disposedFlag;
  }

  readonly getState = (): S => this.store.getState();
  readonly subscribe = (listener: () => void): Unsubscribe => this.store.subscribe(listener);

  /** Called once, on first attach. Load data, start subscriptions. */
  protected onInit(): void | Promise<void> {}
  /** Called on dispose. Pending `launch` tasks are aborted automatically. */
  protected onDispose(): void {}
  /** Central error hook for `launch`ed tasks. */
  protected onError(_error: AppError): void {}

  protected setState(update: Partial<S> | ((prev: S) => Partial<S>)): void {
    if (this.disposedFlag) return;
    this.store.setState((prev) => ({
      ...prev,
      ...(typeof update === 'function' ? update(prev) : update),
    }));
  }

  /** Aborted when the view model is disposed — pass to network calls. */
  protected get signal(): AbortSignal {
    return this.controller.signal;
  }

  /** Runs an async task bound to this VM's lifetime; errors are normalised and routed to `onError`. */
  protected launch(task: (signal: AbortSignal) => Promise<void>): Promise<void> {
    const signal = this.controller.signal;
    return task(signal).catch((thrown: unknown) => {
      if (signal.aborted) return;
      this.onError(AppError.from(thrown));
    });
  }

  /** Registers cleanup to run on dispose (subscriptions, timers). */
  protected addCleanup(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  /** @internal Ref-counted attach. Survives React StrictMode's mount→unmount→mount. */
  attach(): void {
    if (this.pendingDispose) clearTimeout(this.pendingDispose);
    this.pendingDispose = undefined;
    this.refs++;
    if (!this.initialised) {
      this.initialised = true;
      void this.launch(async () => {
        await this.onInit();
      });
    }
  }

  /** @internal */
  detach(): void {
    this.refs = Math.max(0, this.refs - 1);
    if (this.refs === 0) this.pendingDispose = setTimeout(() => this.dispose(), 0);
  }

  dispose(): void {
    if (this.disposedFlag) return;
    this.disposedFlag = true;
    this.controller.abort();
    for (const c of this.cleanups.splice(0).reverse()) c();
    this.onDispose();
  }
}
