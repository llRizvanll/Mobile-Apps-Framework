import { featureFlags } from '@config/featureFlags';
import { cleanupTestApps, createTestApp, createTestBrand } from '@framework/testing';
import { todosModule } from '../../todos/module';
import { assistantModule } from '../module';

afterEach(cleanupTestApps);

describe('assistant module', () => {
  const modules = [todosModule, assistantModule];

  it('refuses to start for a brand without AI', async () => {
    const brand = createTestBrand({ config: { features: { assistant: true } } });
    await expect(
      createTestApp({ brand, modules, flags: { definitions: featureFlags } }),
    ).rejects.toThrow(/ai.enabled is false/);
  });

  it('is switched off with todos because it requires it', async () => {
    const brand = createTestBrand({
      config: { features: { assistant: true, todos: false }, ai: { enabled: true } },
    });
    const { app } = await createTestApp({ brand, modules, flags: { definitions: featureFlags } });
    expect(app.modules.map((m) => m.id)).not.toContain('assistant');
  });
});
