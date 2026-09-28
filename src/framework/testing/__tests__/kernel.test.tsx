import { AIToolToken, ToolRegistryToken, defineTool } from '@framework/ai';
import { createToken } from '@framework/di';
import { AppError } from '@framework/foundation';
import { I18nToken } from '@framework/i18n';
import {
  AccessTokenProviderToken,
  AuthRefreshPortToken,
  HttpClientToken,
} from '@framework/network';
import { createSlice, sessionSlice, settingsSlice } from '@framework/state';
import { MemoryKeyValueStore } from '@framework/storage';
import {
  FeatureFlagsToken,
  createApp,
  defineModule,
  resolveBrandConfig,
  type FrameworkModule,
} from '@framework/core';
import { createTestApp, createTestBrand } from '../index';

const wait = () => new Promise((r) => setTimeout(() => r(undefined), 0));

describe('brand config', () => {
  it('applies environment overlays and validates', () => {
    const brand = createTestBrand({
      environments: { production: { api: { rest: { baseUrl: 'https://api.prod.example' } } } },
    });
    expect(resolveBrandConfig(brand, 'production').api.rest.baseUrl).toBe(
      'https://api.prod.example',
    );
    expect(resolveBrandConfig(brand, 'development').api.rest.timeoutMs).toBe(30_000);
    expect(Object.isFrozen(resolveBrandConfig(brand, 'development').api)).toBe(true);
  });

  it('reports every invalid field', () => {
    const brand = createTestBrand({
      config: { api: { rest: { baseUrl: 'not a url' } }, i18n: { defaultLocale: 'de' } },
    });
    expect(() => resolveBrandConfig(brand, 'development')).toThrow(
      /api\.rest\.baseUrl[\s\S]*defaultLocale must be in supportedLocales/,
    );
  });
});

describe('app kernel', () => {
  it('boots, traces each phase and tags crash reports', async () => {
    const { app, spans, crash, logs } = await createTestApp();
    expect(app.store.getState().app.phase).toBe('ready');
    expect(spans.spans.map((s) => s.name)).toEqual(
      expect.arrayContaining([
        'app.start.rehydrate',
        'app.start.locale',
        'app.start.ai-tools',
        'app.start',
      ]),
    );
    expect(crash.tags).toEqual({ brand: 'test-brand', environment: 'development' });
    expect(logs.records.some((r) => r.message === 'app.started')).toBe(true);
    await expect(Promise.all([app.start(), app.start()])).resolves.toBeDefined();
  });

  it('orders modules by dependency, gates by feature flag and wires their contributions', async () => {
    const started: string[] = [];
    const Greeter = createToken<{ greet(): string }>('Greeter');
    const counter = createSlice({ name: 'counter', initialState: { n: 0 }, reducers: {} });
    const core = defineModule({
      id: 'core-feature',
      register: (c) => c.bind(Greeter).toValue({ greet: () => 'hi' }),
      reducers: { counter: counter.reducer },
      translations: { en: { feature: { title: 'Feature title' } } },
      tools: () => [
        defineTool({
          name: 'feature.ping',
          description: 'ping',
          inputSchema: {},
          execute: () => Promise.resolve('pong'),
        }),
      ],
      onStart: ({ resolver }) => void started.push(`core:${resolver.get(Greeter).greet()}`),
    });
    const dependent: FrameworkModule = {
      id: 'dependent',
      dependsOn: ['core-feature'],
      onStart: () => void started.push('dependent'),
    };
    const flagged: FrameworkModule = {
      id: 'beta',
      featureFlag: 'beta',
      onStart: () => void started.push('beta'),
    };

    const { app } = await createTestApp({ modules: [dependent, flagged, core] });
    expect(started).toEqual(['core:hi', 'dependent']);
    expect((app.store.getState() as unknown as { counter: { n: number } }).counter.n).toBe(0);
    expect(app.container.get(I18nToken).t('feature.title')).toBe('Feature title');
    expect(app.container.get(ToolRegistryToken).get('feature.ping')).toBeDefined();
    expect(app.container.get(FeatureFlagsToken).isEnabled('beta')).toBe(false);
  });

  it('fails fast on missing module dependencies', () => {
    expect(() =>
      createApp({
        brand: createTestBrand(),
        environment: 'development',
        modules: [{ id: 'a', dependsOn: ['ghost'] }],
      }),
    ).toThrow(/depends on missing or disabled module "ghost"/);
  });

  it('surfaces boot failures in state and allows retry', async () => {
    let fail = true;
    const flaky: FrameworkModule = {
      id: 'flaky',
      onStart: () => {
        if (fail) throw new AppError('network', 'offline');
      },
    };
    const { app, crash } = await createTestApp({ modules: [flaky], manualStart: true });
    await expect(app.start()).rejects.toThrow('offline');
    expect(app.store.getState().app).toMatchObject({ phase: 'failed', bootError: 'offline' });
    expect(crash.exceptions).toHaveLength(1);
    fail = false;
    await app.start();
    expect(app.store.getState().app.phase).toBe('ready');
  });

  it('wires REST with brand headers, locale and transparent token refresh', async () => {
    let token = 'expired';
    const authModule: FrameworkModule = {
      id: 'auth',
      register: (c) => {
        c.bind(AccessTokenProviderToken).toValue({ getAccessToken: () => Promise.resolve(token) });
        c.bind(AuthRefreshPortToken).toValue({
          refresh: () => {
            token = 'fresh';
            return Promise.resolve(true);
          },
        });
      },
    };
    const { app, http } = await createTestApp({ modules: [authModule] });
    http.on('GET', '/me', (req) =>
      req.headers['Authorization'] === 'Bearer fresh' ? { data: { id: 'u1' } } : { status: 401 },
    );
    const res = await app.container.get(HttpClientToken).get<{ id: string }>('/me');
    expect(res.ok && res.value.data.id).toBe('u1');
    const last = http.last();
    expect(last?.url).toBe('https://api.test.local/me');
    expect(last?.headers).toMatchObject({
      'X-Brand': 'test-brand',
      'Accept-Language': 'en',
      'X-App-Version': '1.0.0',
    });
    expect(last?.headers['traceparent']).toMatch(/^00-/);
  });

  it('persists settings/session across launches and reacts to shell actions', async () => {
    const storage = new MemoryKeyValueStore();
    const first = await createTestApp({ adapters: { keyValueStore: storage } });
    first.app.store.dispatch(settingsSlice.actions.localeChanged('ar'));
    first.app.store.dispatch(sessionSlice.actions.signedIn({ userId: 'u42' }));
    await wait();
    expect(first.app.container.get(I18nToken).direction).toBe('rtl');
    expect(first.crash.user).toEqual({ id: 'u42' });
    expect(first.analytics.events).toContainEqual({ type: 'identify', name: 'u42' });
    await first.app.stop();

    const second = await createTestApp({ adapters: { keyValueStore: storage } });
    expect(second.app.store.getState().session.userId).toBe('u42');
    expect(second.app.container.get(I18nToken).locale).toBe('ar');
  });

  it('persists slices that modules opt into', async () => {
    const storage = new MemoryKeyValueStore();
    const cart = createSlice({
      name: 'cart',
      initialState: { items: 0 },
      reducers: {
        add: (s) => {
          s.items++;
        },
      },
    });
    const cartModule: FrameworkModule = {
      id: 'cart',
      reducers: { cart: cart.reducer },
      persist: ['cart'],
    };
    const first = await createTestApp({
      modules: [cartModule],
      adapters: { keyValueStore: storage },
    });
    first.app.store.dispatch(cart.actions.add());
    await first.app.stop();
    const second = await createTestApp({
      modules: [cartModule],
      adapters: { keyValueStore: storage },
    });
    expect((second.app.store.getState() as unknown as { cart: { items: number } }).cart.items).toBe(
      1,
    );
  });

  it('registers AI tools contributed through DI multi-bindings', async () => {
    const { app } = await createTestApp({
      overrides: (c) =>
        c.bindMulti(AIToolToken).toValue(
          defineTool({
            name: 'di.tool',
            description: 'd',
            inputSchema: {},
            execute: () => Promise.resolve(1),
          }),
        ),
    });
    expect(
      app.container
        .get(ToolRegistryToken)
        .specs()
        .map((s) => s.name),
    ).toContain('di.tool');
  });
});
