import { Emitter, type Unsubscribe } from '@org/foundation';

export type FlagValue = boolean | string | number;

/** Remote config / experimentation port (Firebase Remote Config, LaunchDarkly, Statsig, ...). */
export interface RemoteConfigProvider {
  fetch(): Promise<Readonly<Record<string, FlagValue>>>;
}

export interface FeatureFlags {
  isEnabled(key: string): boolean;
  get<T extends FlagValue>(key: string, fallback: T): T;
  all(): Readonly<Record<string, FlagValue>>;
  refresh(): Promise<void>;
  readonly onChange: (listener: () => void) => Unsubscribe;
}

/** Brand defaults, overlaid by remote values (remote wins). */
export function createFeatureFlags(
  defaults: Readonly<Record<string, FlagValue>>,
  remote?: RemoteConfigProvider,
): FeatureFlags {
  let values: Record<string, FlagValue> = { ...defaults };
  const events = new Emitter<{ change: undefined }>();
  return {
    isEnabled: (key) => values[key] === true,
    get: <T extends FlagValue>(key: string, fallback: T): T => {
      const v = values[key];
      return typeof v === typeof fallback ? (v as T) : fallback;
    },
    all: () => values,
    async refresh() {
      if (!remote) return;
      values = { ...defaults, ...(await remote.fetch()) };
      events.emit('change', undefined);
    },
    onChange: (l) => events.on('change', l),
  };
}
