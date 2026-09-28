import { AppError, isDisposable } from '@framework/foundation';
import type { Token, TokenTypes } from './token';

export type Lifetime = 'singleton' | 'scoped' | 'transient';

export interface Resolver {
  get<T>(token: Token<T>): T;
  tryGet<T>(token: Token<T>): T | undefined;
  getAll<T>(token: Token<T>): T[];
  has(token: Token<unknown>): boolean;
}

export type Factory<T> = (resolver: Resolver) => T;

interface Provider<T> {
  readonly factory: Factory<T>;
  readonly lifetime: Lifetime;
}

export interface BindingOptions {
  readonly lifetime?: Lifetime;
}

/** Fluent binding API: `container.bind(Http).toFactory(r => new Http(r.get(Log)))`. */
export interface BindingBuilder<T> {
  toValue(value: T): void;
  toFactory(factory: Factory<T>, options?: BindingOptions): void;
  toClass<D extends readonly Token<unknown>[]>(
    ctor: new (...args: TokenTypes<D>) => T,
    deps: D,
    options?: BindingOptions,
  ): void;
  /** Alias another token (e.g. bind a port to an adapter's token). */
  toToken(other: Token<T>): void;
}

/**
 * A group of related bindings. Feature modules, adapters and tests all register through modules,
 * which keeps composition roots declarative.
 */
export interface ServiceModule {
  readonly name: string;
  register(container: Container): void;
}

export const defineServiceModule = (
  name: string,
  register: (container: Container) => void,
): ServiceModule => ({
  name,
  register,
});

/**
 * Hierarchical IoC container.
 * - singleton: one instance, owned by the container that declares the binding.
 * - scoped:    one instance per scope (`createScope()`), e.g. per user session or per screen.
 * - transient: new instance every resolution.
 * Multi-bindings (`bindMulti` + `getAll`) support plugin-style extension points
 * (HTTP middleware, analytics sinks, AI tools).
 */
export class Container implements Resolver {
  private readonly providers = new Map<symbol, Provider<unknown>>();
  private readonly multiProviders = new Map<symbol, Provider<unknown>[]>();
  private readonly instances = new Map<symbol, unknown>();
  private readonly resolving: Token<unknown>[] = [];
  private readonly loadedModules = new Set<string>();
  private readonly children = new Set<Container>();
  private disposed = false;

  constructor(private readonly parent?: Container) {}

  bind<T>(token: Token<T>): BindingBuilder<T> {
    return this.builder<T>((provider) => {
      this.instances.delete(token.key);
      this.providers.set(token.key, provider);
    });
  }

  /** Adds a contribution to a multi-binding. Resolve all contributions with `getAll`. */
  bindMulti<T>(token: Token<T>): BindingBuilder<T> {
    return this.builder<T>((provider) => {
      const list = this.multiProviders.get(token.key) ?? [];
      list.push(provider);
      this.multiProviders.set(token.key, list);
    });
  }

  /** Replace an existing binding — intended for tests and brand-specific overrides. */
  override<T>(token: Token<T>): BindingBuilder<T> {
    return this.bind(token);
  }

  load(...modules: ServiceModule[]): this {
    for (const mod of modules) {
      if (this.loadedModules.has(mod.name)) continue;
      this.loadedModules.add(mod.name);
      mod.register(this);
    }
    return this;
  }

  has(token: Token<unknown>): boolean {
    return this.providers.has(token.key) || (this.parent?.has(token) ?? false);
  }

  get<T>(token: Token<T>): T {
    this.assertAlive();
    const found = this.lookup(token);
    if (!found) {
      throw new AppError('di', `No binding for ${token.description}${this.resolutionPath(token)}`, {
        meta: { token: token.description },
      });
    }
    return this.instantiate(token, found.provider, found.owner);
  }

  tryGet<T>(token: Token<T>): T | undefined {
    return this.has(token) ? this.get(token) : undefined;
  }

  getAll<T>(token: Token<T>): T[] {
    this.assertAlive();
    const inherited = this.parent?.getAll(token) ?? [];
    const own = (this.multiProviders.get(token.key) ?? []) as Provider<T>[];
    return [...inherited, ...own.map((p) => this.withCycleGuard(token, () => p.factory(this)))];
  }

  createScope(): Container {
    const child = new Container(this);
    this.children.add(child);
    return child;
  }

  /** Disposes owned singletons/scoped instances (and child scopes) that implement `dispose()`. */
  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    for (const child of this.children) await child.dispose();
    const owned = [...this.instances.values()].reverse();
    this.instances.clear();
    for (const instance of owned) if (isDisposable(instance)) await instance.dispose();
    this.parent?.children.delete(this);
  }

  private lookup<T>(token: Token<T>): { provider: Provider<T>; owner: Container } | undefined {
    const provider = this.providers.get(token.key) as Provider<T> | undefined;
    if (provider) return { provider, owner: this };
    return this.parent?.lookup(token);
  }

  private instantiate<T>(token: Token<T>, provider: Provider<T>, owner: Container): T {
    if (provider.lifetime === 'transient')
      return this.withCycleGuard(token, () => provider.factory(this));
    // Singletons live in the declaring container; scoped instances live in the requesting scope.
    const cacheOwner = provider.lifetime === 'singleton' ? owner : this;
    if (cacheOwner.instances.has(token.key)) return cacheOwner.instances.get(token.key) as T;
    const instance = this.withCycleGuard(token, () => provider.factory(cacheOwner));
    cacheOwner.instances.set(token.key, instance);
    return instance;
  }

  private withCycleGuard<T>(token: Token<unknown>, fn: () => T): T {
    if (this.resolving.includes(token)) {
      throw new AppError(
        'di',
        `Circular dependency: ${[...this.resolving, token].map((t) => t.description).join(' -> ')}`,
      );
    }
    this.resolving.push(token);
    try {
      return fn();
    } finally {
      this.resolving.pop();
    }
  }

  private resolutionPath(token: Token<unknown>): string {
    return this.resolving.length
      ? ` (while resolving ${[...this.resolving, token].map((t) => t.description).join(' -> ')})`
      : '';
  }

  private assertAlive(): void {
    if (this.disposed) throw new AppError('di', 'Container has been disposed');
  }

  private builder<T>(commit: (provider: Provider<T>) => void): BindingBuilder<T> {
    return {
      toValue: (value) => commit({ factory: () => value, lifetime: 'singleton' }),
      toFactory: (factory, options) =>
        commit({ factory, lifetime: options?.lifetime ?? 'singleton' }),
      toClass: (ctor, deps, options) =>
        commit({
          factory: (r) => new ctor(...(deps.map((d) => r.get(d)) as TokenTypes<typeof deps>)),
          lifetime: options?.lifetime ?? 'singleton',
        }),
      toToken: (other) => commit({ factory: (r) => r.get(other), lifetime: 'transient' }),
    };
  }
}

export const createContainer = (...modules: ServiceModule[]): Container =>
  new Container().load(...modules);
