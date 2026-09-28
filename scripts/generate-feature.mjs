#!/usr/bin/env node
/**
 * Scaffolds a clean-architecture feature module and registers it with the app.
 *
 *   npm run gen:feature -- <name> [--entity Name] [--app example] [--flag] [--dry-run]
 *
 * Produces domain/ (entity, port, use case) → data/ (DTO + REST repo) → presentation/ (MVVM VM +
 * screen) → ai/ (tools) → module.ts, plus tests. See docs/features.md for the conventions.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT,
  camel,
  fail,
  insertAfterLast,
  parseArgs,
  pascal,
  replaceIn,
  singular,
  writeFiles,
} from './lib/util.mjs';

const args = parseArgs(process.argv.slice(2));
const name = args._[0];
if (!name || !/^[a-z][a-z0-9-]*$/.test(name))
  fail('Usage: npm run gen:feature -- <kebab-name> [--entity Name] [--app example] [--flag]');

const app = args.app ?? 'example';
const appDir = join(ROOT, 'apps', app);
if (!existsSync(appDir)) fail(`App "${app}" not found in apps/`);
const featureDir = join(appDir, 'src', 'features', name);
if (existsSync(featureDir) && !args.force) fail(`Feature "${name}" already exists`);

const E = args.entity ?? pascal(singular(name)); // Entity
const Es = pascal(name); // Plural type prefix
const e = camel(E);
const es = camel(name);
const moduleName = `${es}Module`;
const ns = camel(name); // i18n namespace

const files = {
  [`domain/${E}.ts`]: `
import type { Branded } from '@org/foundation';

export type ${E}Id = Branded<string, '${E}Id'>;

export interface ${E} {
  readonly id: ${E}Id;
  readonly title: string;
  readonly updatedAt: Date;
}
`,
  [`domain/${E}Repository.ts`]: `
import type { AppError, Result } from '@org/foundation';
import type { ${E} } from './${E}';

/** Port — implemented in data/. */
export interface ${E}Repository {
  list(): Promise<Result<readonly ${E}[], AppError>>;
}
`,
  'domain/usecases.ts': `
import type { AppError, Result } from '@org/foundation';
import type { ${E} } from './${E}';
import type { ${E}Repository } from './${E}Repository';

export class Get${Es} {
  constructor(private readonly repo: ${E}Repository) {}
  execute(): Promise<Result<readonly ${E}[], AppError>> {
    return this.repo.list();
  }
}
`,
  'data/dto.ts': `
import { z } from 'zod';
import type { ${E}, ${E}Id } from '../domain/${E}';

export const ${e}DtoSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  updated_at: z.string(),
});
export const ${e}ListDtoSchema = z.object({ items: z.array(${e}DtoSchema) });

export const toDomain = (dto: z.output<typeof ${e}DtoSchema>): ${E} => ({
  id: dto.id as ${E}Id,
  title: dto.title,
  updatedAt: new Date(dto.updated_at),
});
`,
  [`data/Rest${E}Repository.ts`]: `
import { mapResult } from '@org/foundation';
import type { HttpClient } from '@org/network';
import type { ${E}Repository } from '../domain/${E}Repository';
import { ${e}ListDtoSchema, toDomain } from './dto';

export class Rest${E}Repository implements ${E}Repository {
  constructor(private readonly http: HttpClient) {}

  async list() {
    const res = await this.http.get('/${name}', { parser: ${e}ListDtoSchema, meta: { operation: '${name}.list' } });
    return mapResult(res, (r) => r.data.items.map(toDomain));
  }
}
`,
  'tokens.ts': `
import { createToken } from '@org/di';
import type { ${E}Repository } from './domain/${E}Repository';
import type { Get${Es} } from './domain/usecases';

export const ${E}RepositoryToken = createToken<${E}Repository>('${name}.Repository');
export const Get${Es}Token = createToken<Get${Es}>('${name}.Get${Es}');
`,
  [`presentation/${Es}ViewModel.ts`]: `
import type { AppError } from '@org/foundation';
import { ViewModel } from '@org/presentation';
import type { ${E} } from '../domain/${E}';
import type { Get${Es} } from '../domain/usecases';

export interface ${Es}State {
  readonly items: readonly ${E}[];
  readonly loading: boolean;
  readonly errorKey: string | null;
}

export class ${Es}ViewModel extends ViewModel<${Es}State> {
  constructor(private readonly get${Es}: Get${Es}) {
    super({ items: [], loading: false, errorKey: null });
  }

  protected override onInit(): Promise<void> {
    return this.refresh();
  }

  protected override onError(error: AppError): void {
    this.setState({ loading: false, errorKey: error.userMessageKey ?? '${ns}.errors.generic' });
  }

  readonly refresh = async (): Promise<void> => {
    this.setState({ loading: true, errorKey: null });
    const res = await this.get${Es}.execute();
    if (res.ok) this.setState({ items: res.value, loading: false });
    else this.onError(res.error);
  };
}
`,
  [`presentation/${Es}Screen.tsx`]: `
import { FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolver } from '@org/core';
import { useTranslation } from '@org/i18n';
import { useViewModel } from '@org/presentation';
import { Divider, EmptyState, ErrorState, ListItem, Screen, Text } from '@org/ui';
import { Get${Es}Token } from '../tokens';
import type { ${Es}Resources } from '../translations';
import { ${Es}ViewModel } from './${Es}ViewModel';

export function ${Es}Screen() {
  const r = useResolver();
  const [state, vm] = useViewModel(() => new ${Es}ViewModel(r.get(Get${Es}Token)));
  const { t } = useTranslation<${Es}Resources>();
  const insets = useSafeAreaInsets();

  if (state.errorKey && state.items.length === 0) {
    return (
      <Screen insets={insets}>
        <ErrorState onRetry={() => void vm.refresh()} />
      </Screen>
    );
  }

  return (
    <Screen insets={insets} padding="none" testID="${name}.screen">
      <FlatList
        data={state.items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text variant="headline" style={{ padding: 16 }}>{t('${ns}.title')}</Text>}
        refreshControl={<RefreshControl refreshing={state.loading} onRefresh={() => void vm.refresh()} />}
        ItemSeparatorComponent={Divider}
        ListEmptyComponent={state.loading ? null : <EmptyState title={t('${ns}.empty')} />}
        renderItem={({ item }) => <ListItem title={item.title} testID={\`${name}.item.\${item.id}\`} />}
      />
    </Screen>
  );
}
`,
  'ai/tools.ts': `
import { defineTool } from '@org/ai';
import type { Resolver } from '@org/di';
import { Get${Es}Token } from '../tokens';

/** AI capabilities — call the same use cases as the UI. */
export const ${es}Tools = (r: Resolver) => [
  defineTool({
    name: '${name}.list',
    description: 'List the user\\'s ${name}.',
    inputSchema: { type: 'object', properties: {} },
    async execute() {
      const res = await r.get(Get${Es}Token).execute();
      if (!res.ok) throw res.error;
      return res.value.map((x) => ({ id: x.id, title: x.title }));
    },
  }),
];
`,
  'translations.ts': `
export const en = {
  ${ns}: {
    title: '${pascal(name).replace(/([a-z])([A-Z])/g, '$1 $2')}',
    empty: 'Nothing here yet',
    errors: { generic: 'Something went wrong.' },
  },
} as const;

export type ${Es}Resources = typeof en;
`,
  'module.ts': `
import { defineModule } from '@org/core';
import { HttpClientToken } from '@org/network';
import { ${es}Tools } from './ai/tools';
import { Rest${E}Repository } from './data/Rest${E}Repository';
import { Get${Es} } from './domain/usecases';
import { ${E}RepositoryToken, Get${Es}Token } from './tokens';
import { en } from './translations';

export const ${moduleName} = defineModule({
  id: '${name}',${args.flag ? `\n  featureFlag: '${name}',` : ''}
  register(c) {
    c.bind(${E}RepositoryToken).toFactory((r) => new Rest${E}Repository(r.get(HttpClientToken)));
    c.bind(Get${Es}Token).toClass(Get${Es}, [${E}RepositoryToken] as const);
  },
  translations: { en },
  tools: ${es}Tools,
});
`,
  [`__tests__/${name}.test.ts`]: `
import { AppError, err, ok } from '@org/foundation';
import type { ${E}, ${E}Id } from '../domain/${E}';
import type { ${E}Repository } from '../domain/${E}Repository';
import { Get${Es} } from '../domain/usecases';
import { ${Es}ViewModel } from '../presentation/${Es}ViewModel';

const item = (id: string): ${E} => ({ id: id as ${E}Id, title: \`Item \${id}\`, updatedAt: new Date(0) });
const tick = () => new Promise((r) => setTimeout(() => r(undefined), 0));

class Fake${E}Repository implements ${E}Repository {
  failure: AppError | null = null;
  list = jest.fn(() => Promise.resolve(this.failure ? err(this.failure) : ok([item('1')])));
}

describe('${name} feature', () => {
  it('loads items on init', async () => {
    const vm = new ${Es}ViewModel(new Get${Es}(new Fake${E}Repository()));
    vm.attach();
    await tick();
    expect(vm.state.items.map((i) => i.id)).toEqual(['1']);
  });

  it('exposes an i18n error key on failure', async () => {
    const repo = new Fake${E}Repository();
    repo.failure = new AppError('network', 'offline');
    const vm = new ${Es}ViewModel(new Get${Es}(repo));
    await vm.refresh();
    expect(vm.state.errorKey).toBe('${ns}.errors.generic');
  });
});
`,
};

console.log(`\nFeature "${name}" (entity ${E}) → apps/${app}/src/features/${name}`);
if (args['dry-run']) {
  Object.keys(files).forEach((f) => console.log(`  would create ${f}`));
  process.exit(0);
}
writeFiles(featureDir, files, { force: !!args.force });

const composition = join(appDir, 'src', 'bootstrap', 'createApplication.ts');
insertAfterLast(
  composition,
  /^import .* from '\.\.\/features\//,
  `import { ${moduleName} } from '../features/${name}/module';`,
);
replaceIn(composition, /export const appModules = \[([^\]]*)\]/, (_m, list) =>
  list.includes(moduleName) ? _m : `export const appModules = [${list.trim()}, ${moduleName}]`,
);

console.log(`
✔ Done. Next:
  1. Model your entity in domain/${E}.ts and the API contract in data/dto.ts
  2. Render <${Es}Screen /> from your navigator${args.flag ? `\n  3. Enable the flag per brand: features: { '${name}': true }` : ''}
  Run: npm run verify
`);
