/**
 * Typed analytics. Apps declare their event catalogue by augmenting `AnalyticsEventMap`:
 *
 *   declare module '@org/observability' {
 *     interface AnalyticsEventMap { checkout_completed: { orderId: string; total: number } }
 *   }
 *
 * Unknown events stay allowed (`string`) so modules can evolve independently.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AnalyticsEventMap {}

export type AnalyticsProps = Readonly<Record<string, string | number | boolean | null | undefined>>;

/* eslint-disable @typescript-eslint/no-redundant-type-constituents -- KnownEvent is `never` until apps augment the map */
type KnownEvent = keyof AnalyticsEventMap & string;
export type EventName = KnownEvent | (string & {});
/* eslint-enable @typescript-eslint/no-redundant-type-constituents */
export type EventProps<E extends EventName> = E extends KnownEvent
  ? AnalyticsEventMap[E]
  : AnalyticsProps;

/** Port implemented by provider adapters (Segment, Amplitude, Firebase, Mixpanel, ...). */
export interface AnalyticsProvider {
  readonly name: string;
  track(event: string, props?: AnalyticsProps): void;
  screen(name: string, props?: AnalyticsProps): void;
  identify(userId: string, traits?: AnalyticsProps): void;
  reset(): void;
}

export interface Analytics {
  track<E extends EventName>(event: E, props?: EventProps<E>): void;
  screen(name: string, props?: AnalyticsProps): void;
  identify(userId: string, traits?: AnalyticsProps): void;
  reset(): void;
  setEnabled(enabled: boolean): void;
  readonly enabled: boolean;
}

export interface AnalyticsOptions {
  readonly providers: readonly AnalyticsProvider[];
  readonly enabled?: boolean;
  /** Global props merged into every event (app version, brand id, ...). */
  readonly superProps?: AnalyticsProps;
  /** Last chance to drop/modify events (consent, sampling, PII scrubbing). Return null to drop. */
  readonly beforeSend?: (event: string, props: AnalyticsProps) => AnalyticsProps | null;
}

/** Composite analytics: consent-aware fan-out to all providers; provider failures are isolated. */
export function createAnalytics(options: AnalyticsOptions): Analytics {
  let enabled = options.enabled ?? true;
  const each = (fn: (p: AnalyticsProvider) => void): void => {
    if (!enabled) return;
    for (const p of options.providers) {
      try {
        fn(p);
      } catch {
        // isolate provider failures
      }
    }
  };
  const prepare = (event: string, props?: object): AnalyticsProps | null => {
    const merged: AnalyticsProps = {
      ...options.superProps,
      ...(props as AnalyticsProps | undefined),
    };
    return options.beforeSend ? options.beforeSend(event, merged) : merged;
  };
  return {
    get enabled() {
      return enabled;
    },
    setEnabled: (value) => {
      enabled = value;
    },
    track: (event, props) => {
      const p = prepare(event, props);
      if (p) each((x) => x.track(event, p));
    },
    screen: (name, props) => {
      const p = prepare(`screen:${name}`, props);
      if (p) each((x) => x.screen(name, p));
    },
    identify: (userId, traits) => each((x) => x.identify(userId, traits)),
    reset: () => each((x) => x.reset()),
  };
}

export class MemoryAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'memory';
  readonly events: {
    type: 'track' | 'screen' | 'identify' | 'reset';
    name?: string;
    props?: AnalyticsProps;
  }[] = [];
  track(name: string, props?: AnalyticsProps): void {
    this.events.push({ type: 'track', name, ...(props ? { props } : {}) });
  }
  screen(name: string, props?: AnalyticsProps): void {
    this.events.push({ type: 'screen', name, ...(props ? { props } : {}) });
  }
  identify(name: string, props?: AnalyticsProps): void {
    this.events.push({ type: 'identify', name, ...(props ? { props } : {}) });
  }
  reset(): void {
    this.events.push({ type: 'reset' });
  }
}
