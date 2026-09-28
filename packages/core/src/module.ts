import type { Container, Resolver } from '@org/di';
import { AppError } from '@org/foundation';
import type { TranslationTree } from '@org/i18n';
import type { Logger } from '@org/observability';
import type { AppStore, Reducer } from '@org/state';
import type { AITool } from '@org/ai';
import type { BrandConfig } from './config/schema';

export interface ModuleContext {
  readonly resolver: Resolver;
  readonly config: BrandConfig;
  readonly store: AppStore;
  readonly logger: Logger;
}

/**
 * The unit of composition. A feature (auth, catalog, chat...) is one module that contributes
 * DI bindings, state, copy, AI tools and lifecycle hooks — and nothing else touches its internals.
 */
export interface FrameworkModule {
  readonly id: string;
  readonly dependsOn?: readonly string[];
  /** Brand feature flag gating this module (`config.features[flag]`). */
  readonly featureFlag?: string;
  register?(container: Container, config: BrandConfig): void;
  readonly reducers?: Readonly<Record<string, Reducer>>;
  readonly translations?: Readonly<Record<string, TranslationTree>>;
  /** Capabilities exposed to AI agents. */
  tools?(resolver: Resolver): readonly AITool[];
  onStart?(context: ModuleContext): void | Promise<void>;
  onStop?(context: ModuleContext): void | Promise<void>;
}

export const defineModule = <M extends FrameworkModule>(module: M): M => module;

/** Filters disabled modules and orders the rest so dependencies start first. */
export function resolveModules(
  modules: readonly FrameworkModule[],
  features: Readonly<Record<string, boolean>>,
): FrameworkModule[] {
  const enabled = modules.filter((m) => !m.featureFlag || features[m.featureFlag] === true);
  const byId = new Map<string, FrameworkModule>();
  for (const m of enabled) {
    if (byId.has(m.id)) throw new AppError('config', `Duplicate module id "${m.id}"`);
    byId.set(m.id, m);
  }
  const ordered: FrameworkModule[] = [];
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (m: FrameworkModule, trail: string[]): void => {
    if (state.get(m.id) === 'done') return;
    if (state.get(m.id) === 'visiting')
      throw new AppError('config', `Module cycle: ${[...trail, m.id].join(' -> ')}`);
    state.set(m.id, 'visiting');
    for (const dep of m.dependsOn ?? []) {
      const d = byId.get(dep);
      if (!d)
        throw new AppError(
          'config',
          `Module "${m.id}" depends on missing or disabled module "${dep}"`,
        );
      visit(d, [...trail, m.id]);
    }
    state.set(m.id, 'done');
    ordered.push(m);
  };
  for (const m of enabled) visit(m, []);
  return ordered;
}
