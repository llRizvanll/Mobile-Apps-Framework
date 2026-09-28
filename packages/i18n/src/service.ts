import { Emitter, type Unsubscribe } from '@org/foundation';
import { directionOf, languageOf } from './rtl';
import type {
  Direction,
  PluralForms,
  TranslateParams,
  TranslationKey,
  TranslationTree,
} from './types';

export type ResourceLoader = () => Promise<TranslationTree>;

export interface I18nOptions {
  readonly defaultLocale: string;
  readonly fallbackLocale?: string;
  readonly supportedLocales: readonly string[];
  /** Eager resources: `{ en: { common: {...} } }` (namespaces are top-level keys). */
  readonly resources?: Readonly<Record<string, TranslationTree>>;
  /** Lazy resources per locale — loaded on `setLocale`. */
  readonly loaders?: Readonly<Record<string, ResourceLoader>>;
  /** Invoked for missing keys (log / report to translation tooling). */
  readonly onMissingKey?: (key: string, locale: string) => void;
}

export interface I18nService {
  readonly locale: string;
  readonly direction: Direction;
  readonly supportedLocales: readonly string[];
  t(key: TranslationKey, params?: TranslateParams): string;
  exists(key: string): boolean;
  setLocale(locale: string): Promise<void>;
  /** Deep-merge resources (feature modules and brand overrides register through this). */
  addResources(locale: string, tree: TranslationTree): void;
  readonly onChange: (listener: (locale: string) => void) => Unsubscribe;
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
  formatCurrency(value: number, currency: string, options?: Intl.NumberFormatOptions): string;
  formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
  formatRelative(value: number, unit: Intl.RelativeTimeFormatUnit): string;
}

const isPlural = (v: unknown): v is PluralForms =>
  typeof v === 'object' && v !== null && typeof (v as PluralForms).other === 'string';

function mergeTree(base: TranslationTree, add: TranslationTree): TranslationTree {
  const out: Record<string, TranslationTree[string]> = { ...base };
  for (const [k, v] of Object.entries(add)) {
    const cur = out[k];
    out[k] =
      cur && typeof cur === 'object' && !isPlural(cur) && typeof v === 'object' && !isPlural(v)
        ? mergeTree(cur, v)
        : v;
  }
  return out;
}

/** Chooses the best supported locale for a list of device preferences (`en-GB` → `en`). */
export function matchLocale(
  preferred: readonly string[],
  supported: readonly string[],
  fallback: string,
): string {
  const norm = (l: string): string => l.replace('_', '-').toLowerCase();
  for (const p of preferred) {
    const exact = supported.find((s) => norm(s) === norm(p));
    if (exact) return exact;
    const lang = supported.find((s) => languageOf(s) === languageOf(p));
    if (lang) return lang;
  }
  return fallback;
}

export function createI18n(options: I18nOptions): I18nService {
  const fallback = options.fallbackLocale ?? options.defaultLocale;
  const trees = new Map<string, TranslationTree>(Object.entries(options.resources ?? {}));
  const loaded = new Set<string>(trees.keys());
  const events = new Emitter<{ change: string }>();
  let locale = options.defaultLocale;
  const pluralRules = new Map<string, Intl.PluralRules>();

  /** en-GB → [en-GB, en, fallback] */
  const chain = (l: string): string[] => [...new Set([l, languageOf(l), fallback])];

  const lookup = (tree: TranslationTree | undefined, key: string): unknown => {
    let node: unknown = tree;
    for (const part of key.split('.')) {
      if (typeof node !== 'object' || node === null) return undefined;
      node = (node as Record<string, unknown>)[part];
    }
    return node;
  };

  const resolve = (key: string): { value: string | PluralForms; locale: string } | undefined => {
    for (const l of chain(locale)) {
      const v = lookup(trees.get(l), key);
      if (typeof v === 'string' || isPlural(v)) return { value: v, locale: l };
    }
    return undefined;
  };

  const pluralFor = (l: string, count: number): Intl.LDMLPluralRule => {
    let rules = pluralRules.get(l);
    if (!rules) {
      rules = new Intl.PluralRules(l);
      pluralRules.set(l, rules);
    }
    return rules.select(count);
  };

  const interpolate = (template: string, params: TranslateParams | undefined, l: string): string =>
    template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => {
      const v = params?.[name];
      if (v === undefined) return match;
      if (typeof v === 'number') return new Intl.NumberFormat(l).format(v);
      if (v instanceof Date) return new Intl.DateTimeFormat(l).format(v);
      return v;
    });

  const service: I18nService = {
    get locale() {
      return locale;
    },
    get direction() {
      return directionOf(locale);
    },
    supportedLocales: options.supportedLocales,
    t(key, params) {
      const found = resolve(key);
      if (!found) {
        options.onMissingKey?.(key, locale);
        return key;
      }
      let template: string;
      if (typeof found.value === 'string') template = found.value;
      else {
        const count = params?.count ?? 0;
        const exactZero = count === 0 ? found.value.zero : undefined;
        template = exactZero ?? found.value[pluralFor(found.locale, count)] ?? found.value.other;
      }
      return interpolate(template, params, locale);
    },
    exists: (key) => resolve(key) !== undefined,
    async setLocale(next) {
      if (!options.supportedLocales.includes(next)) throw new Error(`Unsupported locale "${next}"`);
      for (const l of chain(next)) {
        const loader = options.loaders?.[l];
        if (loader && !loaded.has(l)) {
          service.addResources(l, await loader());
          loaded.add(l);
        }
      }
      if (next === locale) return;
      locale = next;
      events.emit('change', next);
    },
    addResources(l, tree) {
      trees.set(l, mergeTree(trees.get(l) ?? {}, tree));
    },
    onChange: (listener) => events.on('change', listener),
    formatNumber: (v, o) => new Intl.NumberFormat(locale, o).format(v),
    formatCurrency: (v, currency, o) =>
      new Intl.NumberFormat(locale, { style: 'currency', currency, ...o }).format(v),
    formatDate: (v, o) => new Intl.DateTimeFormat(locale, o).format(v),
    formatRelative: (v, unit) =>
      new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(v, unit),
  };
  return service;
}
