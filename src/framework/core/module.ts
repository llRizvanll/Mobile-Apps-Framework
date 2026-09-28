import type { ComponentType } from 'react';
import type { Container, Resolver } from '@framework/di';
import { AppError } from '@framework/foundation';
import type { TranslationTree } from '@framework/i18n';
import type { Logger } from '@framework/observability';
import type { AppStore, Reducer } from '@framework/state';
import type { AITool } from '@framework/ai';
import type { BrandConfig } from './config/schema';

export interface ModuleContext {
  readonly resolver: Resolver;
  readonly config: BrandConfig;
  readonly store: AppStore;
  readonly logger: Logger;
}

/**
 * A top-level destination contributed by a module. The app shell renders tabs from active modules,
 * so disabling a module's flag removes its screens with no shell changes.
 */
export interface ModuleTab {
  /** Stable id (analytics screen name, deep-link segment). */
  readonly key: string;
  /** i18n key for the label. */
  readonly titleKey: string;
  readonly component: ComponentType;
  /** Lower sorts first. Default 100. */
  readonly order?: number;
  /** Optional runtime flag controlling visibility live (without restart). */
  readonly visibleWhen?: string;
}

/**
 * The unit of composition. A feature (auth, catalog, chat...) is one module that contributes
 * DI bindings, state, copy, AI tools and lifecycle hooks — and nothing else touches its internals.
 */
export interface FrameworkModule {
  readonly id: string;
  readonly dependsOn?: readonly string[];
  /** Feature flag gating this module (evaluated at boot through the layered FeatureFlags). */
  readonly featureFlag?: string;
  register?(container: Container, config: BrandConfig): void;
  readonly reducers?: Readonly<Record<string, Reducer>>;
  /** Keys of this module's reducers to persist across launches (versioned snapshot). */
  readonly persist?: readonly string[];
  readonly translations?: Readonly<Record<string, TranslationTree>>;
  /** Top-level screens this module contributes to the app shell. */
  readonly tabs?: readonly ModuleTab[];
  /** Capabilities exposed to AI agents. */
  tools?(resolver: Resolver): readonly AITool[];
  onStart?(context: ModuleContext): void | Promise<void>;
  onStop?(context: ModuleContext): void | Promise<void>;
}

export const defineModule = <M extends FrameworkModule>(module: M): M => module;

/** Filters disabled modules and orders the rest so dependencies start first. */
export function resolveModules(
  modules: readonly FrameworkModule[],
  isEnabled: (flag: string) => boolean,
): FrameworkModule[] {
  const enabled = modules.filter((m) => !m.featureFlag || isEnabled(m.featureFlag));
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
