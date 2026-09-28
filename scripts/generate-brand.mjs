#!/usr/bin/env node
/**
 * Scaffolds a new brand in src/brands/<id> and registers it with the app and the brand contract tests.
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

const flagRegistry = JSON.parse(readFileSync(join(ROOT, 'src/config/feature-flags.json'), 'utf8'));
// New brands start from registry defaults; only module flags are listed so they're easy to flip.
const features = Object.fromEntries(
  Object.entries(flagRegistry)
    .filter(([, d]) => d.kind === 'module')
    .map(([k, d]) => [k, d.default]),
);

writeFiles(join(ROOT, 'src', 'brands', id), {
  'native.json': `${JSON.stringify({ id, displayName: name, app: { bundleId: bundle, scheme: id.replace(/-/g, ''), version: '1.0.0' }, primaryColor: color }, null, 2)}\n`,
  'features.json': `${JSON.stringify(features, null, 2)}\n`,
  'index.ts': `
import { defineBrand } from '@framework/core';
import features from './features.json';
import native from './native.json';

export default defineBrand({
  config: {
    // Store identity lives in native.json (shared with app.config.ts).
    id: native.id,
    displayName: native.displayName,
    app: native.app,
    api: { rest: { baseUrl: 'https://api.dev.${id}.example/v1' } },
    i18n: { defaultLocale: '${locales[0]}', supportedLocales: ${JSON.stringify(locales).replace(/"/g, "'")} },
    // Flag values — edit features.json or: npm run flags -- on <flag> --brand ${id}
    features,
  },
  environments: {
    staging: { api: { rest: { baseUrl: 'https://api.staging.${id}.example/v1' } } },
    production: {
      api: { rest: { baseUrl: 'https://api.${id}.example/v1' } },
      observability: { logLevel: 'warn' },
      features: { devtools: false },
    },
  },
  theme: {
    name: '${id}',
    // Only primary is set; \`npm test\` runs the brand contract test (WCAG AA contrast in light + dark).
    colors: { light: { primary: '${color}', focus: '${color}' } },
  },
  translations: {
${translations}
  },
});
`,
});

const brandsFile = join(ROOT, 'src/app/bootstrap/brands.ts');
insertAfterLast(brandsFile, /^import \w+ from '@brands\//, `import ${ident} from '@brands/${id}';`);
replaceIn(brandsFile, /export const brands = \{([^}]*)\}/, (m, list) =>
  list.includes(ident) ? m : `export const brands = {${list.trimEnd()}, ${ident} }`,
);

// EAS cloud builds don't see your shell env — each brand gets its own build profiles.
const easFile = join(ROOT, 'eas.json');
const eas = JSON.parse(readFileSync(easFile, 'utf8'));
for (const profile of ['development', 'preview', 'production'])
  eas.build[`${profile}-${id}`] ??= { extends: profile, env: { EXPO_PUBLIC_BRAND: id } };
eas.submit[`production-${id}`] ??= {};
writeFileSync(easFile, `${JSON.stringify(eas, null, 2)}\n`);
console.log('  ~ eas.json');

const contract = join(ROOT, 'src/brands/__tests__/brands.test.tsx');
insertAfterLast(contract, /^import \w+ from '@brands\//, `import ${ident} from '@brands/${id}';`);
replaceIn(contract, /const brands: Record<string, BrandDefinition> = \{([^}]*)\}/, (m, list) =>
  list.includes(ident)
    ? m
    : `const brands: Record<string, BrandDefinition> = {${list.trimEnd()}, ${ident} }`,
);

console.log(`
✔ Brand "${id}" created in src/brands/${id}. Next:
  1. Fill in API URLs, theme, copy in src/brands/${id}/index.ts
  2. Choose features: npm run flags -- list   ·   npm run flags -- on <flag> --brand ${id}
  3. npm test                    (contract test: config valid in all envs, registered flags, WCAG AA)
  4. EXPO_PUBLIC_BRAND=${id} npx expo run:ios
  5. Store build: eas build --profile production-${id} --platform all
`);
