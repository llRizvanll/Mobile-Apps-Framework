#!/usr/bin/env node
/**
 * Scaffolds a new brand package and registers it with the example app and brand contract tests.
 *
 *   npm run gen:brand -- <id> --name "Display Name" --bundle com.company.app [--color "#3D5AFE"] [--locales en,fr]
 *
 * The brand then builds as its own store app: EXPO_PUBLIC_BRAND=<id> npx expo run:ios
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT,
  camel,
  fail,
  insertAfterLast,
  parseArgs,
  replaceIn,
  writeFiles,
} from './lib/util.mjs';

const args = parseArgs(process.argv.slice(2));
const id = args._[0];
if (!id || !/^[a-z][a-z0-9-]*$/.test(id))
  fail(
    'Usage: npm run gen:brand -- <id> --name "Display Name" --bundle com.company.app [--color "#hex"] [--locales en,fr]',
  );
const name = args.name ?? id;
const bundle = args.bundle ?? `com.example.${id.replace(/-/g, '')}`;
if (!/^[a-zA-Z][\w-]*(\.[a-zA-Z][\w-]*)+$/.test(bundle)) fail(`Invalid bundle id "${bundle}"`);
const color = args.color ?? '#3D5AFE';
if (!/^#[0-9a-fA-F]{6}$/.test(color)) fail(`--color must be a 6-digit hex, got "${color}"`);
const locales = (args.locales ?? 'en').split(',').map((l) => l.trim());
const ident = camel(id);

const translations = locales
  .map(
    (l) =>
      `    ${/^[a-z]+$/.test(l) ? l : `'${l}'`}: { brand: { tagline: 'TODO: ${l} tagline' } },`,
  )
  .join('\n');

writeFiles(join(ROOT, 'brands', id), {
  'package.json': `${JSON.stringify(
    {
      name: `@brands/${id}`,
      version: '0.1.0',
      private: true,
      description: `Brand definition for ${name}.`,
      main: './src/index.ts',
      types: './src/index.ts',
      'react-native': './src/index.ts',
      exports: { '.': './src/index.ts', './package.json': './package.json' },
      dependencies: { '@org/core': '0.1.0', '@org/ui': '0.1.0' },
      peerDependencies: { react: '>=19.0.0' },
    },
    null,
    2,
  )}\n`,
  'src/native.json': `${JSON.stringify({ id, displayName: name, app: { bundleId: bundle, scheme: id.replace(/-/g, ''), version: '1.0.0' }, primaryColor: color }, null, 2)}\n`,
  'src/index.ts': `
import { defineBrand } from '@org/core';
import native from './native.json';

export default defineBrand({
  config: {
    id: native.id,
    displayName: native.displayName,
    app: native.app,
    api: { rest: { baseUrl: 'https://api.dev.${id}.example/v1' } },
    i18n: { defaultLocale: '${locales[0]}', supportedLocales: ${JSON.stringify(locales).replace(/"/g, "'")} },
    features: { todos: true },
  },
  environments: {
    staging: { api: { rest: { baseUrl: 'https://api.staging.${id}.example/v1' } } },
    production: { api: { rest: { baseUrl: 'https://api.${id}.example/v1' } }, observability: { logLevel: 'warn' } },
  },
  theme: {
    name: '${id}',
    // Only primary is set; run \`npm test\` — the brand contract test audits WCAG contrast.
    colors: { light: { primary: '${color}', focus: '${color}' } },
  },
  translations: {
${translations}
  },
});
`,
});

const brandsFile = join(ROOT, 'apps/example/src/bootstrap/brands.ts');
insertAfterLast(brandsFile, /^import \w+ from '@brands\//, `import ${ident} from '@brands/${id}';`);
replaceIn(brandsFile, /export const brands = \{([^}]*)\}/, (m, list) =>
  list.includes(ident) ? m : `export const brands = {${list.trimEnd()}, ${ident} }`,
);

const contract = join(ROOT, 'brands/acme/src/__tests__/brands.test.tsx');
insertAfterLast(contract, /^import \w+ from '@brands\//, `import ${ident} from '@brands/${id}';`);
replaceIn(contract, /const brands: Record<string, BrandDefinition> = \{([^}]*)\}/, (m, list) =>
  list.includes(ident)
    ? m
    : `const brands: Record<string, BrandDefinition> = {${list.trimEnd()}, ${ident} }`,
);

for (const pkgPath of ['apps/example/package.json', 'brands/acme/package.json']) {
  const file = join(ROOT, pkgPath);
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  const field = pkgPath.startsWith('apps') ? 'dependencies' : 'devDependencies';
  pkg[field] = Object.fromEntries(
    Object.entries({ ...pkg[field], [`@brands/${id}`]: '0.1.0' }).sort(([a], [b]) =>
      a.localeCompare(b),
    ),
  );
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`  ~ ${pkgPath}`);
}

console.log(`
✔ Brand "${id}" created. Next:
  1. npm install                         (links @brands/${id})
  2. Fill in API URLs, theme, copy in brands/${id}/src/index.ts
  3. npm test                            (contract test: config valid in all envs + WCAG AA)
  4. EXPO_PUBLIC_BRAND=${id} npx expo run:ios   (from apps/example)
`);
