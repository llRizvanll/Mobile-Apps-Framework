import { AppError, Emitter, type Unsubscribe } from '@framework/foundation';
import type { KeyValueStore } from '@framework/storage';
import { z } from 'zod';

export type FlagValue = boolean | string | number;

/** Where a flag's effective value came from (highest layer wins). */
export type FlagSource = 'unknown' | 'default' | 'brand' | 'remote' | 'override';

/** Remote config / experimentation port (Firebase Remote Config, LaunchDarkly, Statsig, ...). */
export interface RemoteConfigProvider {
  fetch(): Promise<Readonly<Record<string, FlagValue>>>;
}

/**
 * Registry entry. `kind`:
 *  - `module`: gates a whole feature module. Evaluated once at boot; changes apply after restart.
 *  - `runtime`: read live (`useFeatureFlag`) — UI switches, limits, copy variants, kill switches.
 */
export const flagDefinitionSchema = z.object({
  default: z.union([z.boolean(), z.string(), z.number()]),
  description: z.string().min(1),
  kind: z.enum(['module', 'runtime']).default('runtime'),
  owner: z.string().optional(),
  /** Other boolean flags that must also be on for this one to be enabled. */
  requires: z.array(z.string()).default([]),
  /** YYYY-MM-DD — `npm run flags -- doctor` warns after this date (clean up stale flags). */
  expires: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const flagRegistrySchema = z.record(
  z
    .string()
    .regex(/^[a-z][a-zA-Z0-9.-]*$/, 'flag keys are lowerCamel / dotted (e.g. todos.swipeActions)'),
  flagDefinitionSchema,
);

export type FlagDefinition = z.output<typeof flagDefinitionSchema>;
export type FlagRegistry = Readonly<Record<string, FlagDefinition>>;

/** Validates a registry (typically imported from JSON) and checks `requires` references. */
export function parseFlagRegistry<T extends Record<string, unknown>>(
  input: T,
): { readonly [K in keyof T]: FlagDefinition } {
  const parsed = flagRegistrySchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      'config',
      `Invalid feature flag registry: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  for (const [key, def] of Object.entries(parsed.data)) {
    for (const dep of def.requires) {
      if (!(dep in parsed.data))
        throw new AppError('config', `Flag "${key}" requires unknown flag "${dep}"`);
    }
  }
  return parsed.data as { readonly [K in keyof T]: FlagDefinition };
}

/** `"assistant=off,todos=on,maxItems=20,variant=b"` → typed values. For env vars / deep links. */
export function parseFlagOverrides(spec: string | undefined): Record<string, FlagValue> {
  const out: Record<string, FlagValue> = {};
  if (!spec) return out;
  for (const pair of spec.split(',')) {
    const [rawKey, rawValue = 'on'] = pair.split('=').map((s) => s.trim());
    if (!rawKey) continue;
    const v = rawValue.toLowerCase();
    out[rawKey] = ['on', 'true', '1', 'yes'].includes(v)
      ? true
      : ['off', 'false', '0', 'no'].includes(v)
        ? false
        : rawValue !== '' && !Number.isNaN(Number(rawValue))
          ? Number(rawValue)
          : rawValue;
  }
  return out;
}

export const FLAG_OVERRIDES_KEY = 'flags.overrides';

/** Reads persisted local overrides (dev panel) — call before `createApp` so module flags see them. */
export async function loadFlagOverrides(store: KeyValueStore): Promise<Record<string, FlagValue>> {
  try {
    const raw = await store.getItem(FLAG_OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, FlagValue>) : {};
  } catch {
    return {};
  }
}

export interface FlagSnapshotEntry {
  readonly key: string;
  readonly value: FlagValue | undefined;
  readonly enabled: boolean;
  readonly source: FlagSource;
  readonly definition: FlagDefinition | undefined;
  /** Module flag whose value differs from the value the app booted with. */
  readonly restartRequired: boolean;
}

export interface FeatureFlags {
  isEnabled(key: string): boolean;
  get<T extends FlagValue>(key: string, fallback: T): T;
  all(): Readonly<Record<string, FlagValue>>;
  source(key: string): FlagSource;
  /** Full picture for dev tooling: every known flag with value, source and restart status. */
  snapshot(): readonly FlagSnapshotEntry[];
  refresh(): Promise<void>;
  readonly overridesAllowed: boolean;
  setOverride(key: string, value: FlagValue): Promise<void>;
  clearOverride(key: string): Promise<void>;
  clearOverrides(): Promise<void>;
  /** Module flags changed since boot (the app must restart to apply them). */
  pendingRestart(): readonly string[];
  readonly onChange: (listener: () => void) => Unsubscribe;
}

export interface FeatureFlagsOptions {
  readonly definitions?: FlagRegistry;
  /** Brand (+ environment overlay) values: `config.features`. */
  readonly brand?: Readonly<Record<string, FlagValue>>;
  readonly remote?: RemoteConfigProvider;
  /** Local overrides known at boot (env var + persisted dev overrides). Highest precedence. */
  readonly overrides?: Readonly<Record<string, FlagValue>>;
  /** Allow `setOverride` (disable in production). Default true. */
  readonly allowOverrides?: boolean;
  /** Where `setOverride` persists (namespaced per brand by the kernel). */
  readonly overrideStore?: KeyValueStore;
}

/**
 * Layered feature flags: registry default < brand (+env overlay) < remote config < local override.
 * Boolean flags additionally require every flag in `requires` to be enabled.
 */
export function createFeatureFlags(options: FeatureFlagsOptions = {}): FeatureFlags {
  const definitions = options.definitions ?? {};
  const defaults: Record<string, FlagValue> = Object.fromEntries(
    Object.entries(definitions).map(([k, d]) => [k, d.default]),
  );
  const brand = { ...options.brand };
  let remote: Record<string, FlagValue> = {};
  let overrides: Record<string, FlagValue> = { ...options.overrides };
  const allowOverrides = options.allowOverrides ?? true;
  const events = new Emitter<{ change: undefined }>();

  const layers = (): [FlagSource, Record<string, FlagValue>][] => [
    ['override', overrides],
    ['remote', remote],
    ['brand', brand],
    ['default', defaults],
  ];
  const lookup = (key: string): { value: FlagValue | undefined; source: FlagSource } => {
    for (const [source, values] of layers())
      if (key in values) return { value: values[key], source };
    return { value: undefined, source: 'unknown' };
  };
  const enabled = (key: string, seen: ReadonlySet<string> = new Set()): boolean => {
    if (seen.has(key)) return false;
    if (lookup(key).value !== true) return false;
    const next = new Set(seen).add(key);
    return (definitions[key]?.requires ?? []).every((dep) => enabled(dep, next));
  };

  const bootState = new Map<string, boolean>(
    Object.entries(definitions)
      .filter(([, d]) => d.kind === 'module')
      .map(([k]) => [k, enabled(k)]),
  );

  const persist = async (): Promise<void> => {
    await options.overrideStore?.setItem(FLAG_OVERRIDES_KEY, JSON.stringify(overrides));
    events.emit('change', undefined);
  };
  const assertAllowed = (): void => {
    if (!allowOverrides)
      throw new AppError('config', 'Local feature flag overrides are disabled in this build');
  };

  const flags: FeatureFlags = {
    isEnabled: (key) => enabled(key),
    get: <T extends FlagValue>(key: string, fallback: T): T => {
      const { value } = lookup(key);
      if (value === undefined) return fallback;
      if (typeof fallback === 'boolean') return enabled(key) as T;
      return typeof value === typeof fallback ? (value as T) : fallback;
    },
    all: () =>
      Object.fromEntries(
        [...new Set(layers().flatMap(([, v]) => Object.keys(v)))].map((k) => [
          k,
          lookup(k).value as FlagValue,
        ]),
      ),
    source: (key) => lookup(key).source,
    snapshot: () =>
      [...new Set([...Object.keys(definitions), ...layers().flatMap(([, v]) => Object.keys(v))])]
        .sort()
        .map((key) => {
          const { value, source } = lookup(key);
          const booted = bootState.get(key);
          return {
            key,
            value,
            enabled: enabled(key),
            source,
            definition: definitions[key],
            restartRequired: booted !== undefined && booted !== enabled(key),
          };
        }),
    async refresh() {
      if (!options.remote) return;
      remote = { ...(await options.remote.fetch()) };
      events.emit('change', undefined);
    },
    overridesAllowed: allowOverrides,
    async setOverride(key, value) {
      assertAllowed();
      overrides = { ...overrides, [key]: value };
      await persist();
    },
    async clearOverride(key) {
      assertAllowed();
      const { [key]: _removed, ...rest } = overrides;
      overrides = rest;
      await persist();
    },
    async clearOverrides() {
      assertAllowed();
      overrides = {};
      await persist();
    },
    pendingRestart: () =>
      [...bootState].filter(([k, booted]) => booted !== enabled(k)).map(([k]) => k),
    onChange: (l) => events.on('change', l),
  };
  return flags;
}
