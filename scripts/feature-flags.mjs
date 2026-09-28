#!/usr/bin/env node
/**
 * Feature-flag CLI — the fastest way to turn features on/off.
 *
 *   npm run flags                                   list all flags (default + per-brand values)
 *   npm run flags -- on assistant                   set the registry default
 *   npm run flags -- off assistant --brand main     set a brand value (src/brands/<id>/features.json)
 *   npm run flags -- off assistant --brand all      every brand
 *   npm run flags -- set todos.maxItems 20 [--brand main]
 *   npm run flags -- unset assistant --brand main     remove a brand value (fall back to default)
 *   npm run flags -- add payments --kind module --description "Payments" [--default off] [--owner team] [--requires todos] [--expires 2027-01-31]
 *   npm run flags -- remove payments                delete everywhere (warns about code references)
 *   npm run flags -- doctor                         validate registry, brands and code references (CI)
 *
 * Temporary, no file changes:  EXPO_PUBLIC_FEATURES="assistant=off,todos.showCompleted=off" npm start
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, fail, parseArgs } from './lib/util.mjs';

const REGISTRY = join(ROOT, 'src/config/feature-flags.json');
const BRANDS_DIR = join(ROOT, 'src/brands');
const KEY = /^[a-z][a-zA-Z0-9.-]*$/;

const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'));
const writeJson = (f, v) => {
  writeFileSync(f, `${JSON.stringify(v, null, 2)}\n`);
  console.log(`  ~ ${relative(ROOT, f)}`);
};
const brandIds = () =>
  readdirSync(BRANDS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(BRANDS_DIR, d.name, 'features.json')))
    .map((d) => d.name);
const brandFile = (id) => join(BRANDS_DIR, id, 'features.json');
const parseValue = (raw) => {
  if (raw === undefined) fail('Missing value');
  const v = String(raw).toLowerCase();
  if (['on', 'true', 'yes', '1'].includes(v)) return true;
  if (['off', 'false', 'no', '0'].includes(v)) return false;
  return raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : String(raw);
};
const omit = (obj, key) => Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));
const fmt = (v) => (v === true ? 'on' : v === false ? 'off' : v === undefined ? '·' : String(v));

const args = parseArgs(process.argv.slice(2));
const [command = 'list', key, rawValue] = args._;
const registry = readJson(REGISTRY);

const targetBrands = () => {
  if (!args.brand) return null;
  const all = brandIds();
  if (args.brand === 'all') return all;
  if (!all.includes(args.brand)) fail(`Unknown brand "${args.brand}". Known: ${all.join(', ')}`);
  return [args.brand];
};
const requireKnown = (k) => {
  if (!k) fail('Missing flag key');
  if (!(k in registry))
    fail(`Unknown flag "${k}". Add it first: npm run flags -- add ${k} --description "…"`);
};

function setValue(k, value) {
  requireKnown(k);
  const def = registry[k];
  if (typeof def.default !== typeof value)
    fail(`"${k}" is a ${typeof def.default} flag; got ${typeof value}`);
  const brands = targetBrands();
  if (!brands) {
    registry[k] = { ...def, default: value };
    writeJson(REGISTRY, registry);
  } else {
    for (const id of brands) writeJson(brandFile(id), { ...readJson(brandFile(id)), [k]: value });
  }
  if (def.kind === 'module') console.log('\nℹ module flag: restart the app (or rebuild) to apply.');
}

function codeReferences(k) {
  const hits = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name) && readFileSync(p, 'utf8').includes(`'${k}'`))
        hits.push(relative(ROOT, p));
    }
  };
  walk(join(ROOT, 'src'));
  return hits;
}

function list() {
  const brands = brandIds();
  const values = Object.fromEntries(brands.map((b) => [b, readJson(brandFile(b))]));
  const rows = Object.entries(registry).map(([k, d]) => [
    k,
    d.kind ?? 'runtime',
    fmt(d.default),
    ...brands.map((b) => fmt(values[b][k])),
    d.owner ?? '',
    d.description,
  ]);
  const header = ['flag', 'kind', 'default', ...brands, 'owner', 'description'];
  const widths = header.map((h, i) =>
    Math.min(
      i === header.length - 1 ? 70 : 40,
      Math.max(h.length, ...rows.map((r) => String(r[i]).length)),
    ),
  );
  const line = (cells) =>
    cells.map((c, i) => String(c).slice(0, widths[i]).padEnd(widths[i])).join('  ');
  console.log(`\n${line(header)}\n${widths.map((w) => '─'.repeat(w)).join('  ')}`);
  for (const r of rows) console.log(line(r));
  console.log(
    `\n· = not set for the brand (registry default applies). Environment overlays live in src/brands/<id>/index.ts(x).\n`,
  );
}

function doctor() {
  const errors = [];
  const warnings = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const [k, d] of Object.entries(registry)) {
    if (!KEY.test(k)) errors.push(`registry: invalid key "${k}"`);
    if (!d.description) errors.push(`registry: "${k}" has no description`);
    if (!['boolean', 'string', 'number'].includes(typeof d.default))
      errors.push(`registry: "${k}" default must be boolean/string/number`);
    if (d.kind && !['module', 'runtime'].includes(d.kind))
      errors.push(`registry: "${k}" kind must be module|runtime`);
    for (const dep of d.requires ?? [])
      if (!(dep in registry)) errors.push(`registry: "${k}" requires unknown flag "${dep}"`);
    if (d.expires && d.expires < today)
      warnings.push(`"${k}" expired on ${d.expires} — remove it or extend the date`);
    if (codeReferences(k).length === 0)
      warnings.push(`"${k}" is not referenced in src/ (dead flag?)`);
  }
  for (const b of brandIds()) {
    for (const [k, v] of Object.entries(readJson(brandFile(b)))) {
      if (!(k in registry)) errors.push(`brand ${b}: unknown flag "${k}"`);
      else if (typeof v !== typeof registry[k].default)
        errors.push(`brand ${b}: "${k}" should be ${typeof registry[k].default}`);
    }
  }
  // Flags referenced in code must be registered.
  const used = new Set();
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (
        /\.(ts|tsx)$/.test(e.name) &&
        !p.includes('__tests__') &&
        !p.includes(`${join('src', 'framework')}`)
      ) {
        // Strip comments so documentation examples don't count as references.
        const src = readFileSync(p, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '');
        for (const m of src.matchAll(
          /(?:useFlag|useFlagValue|flag|useFeatureFlag)\(\s*'([^']+)'|visibleWhen:\s*'([^']+)'/g,
        ))
          used.add(m[1] ?? m[2]);
      }
    }
  };
  walk(join(ROOT, 'src'));
  for (const k of used)
    if (!(k in registry)) errors.push(`code references unregistered flag "${k}"`);

  for (const w of warnings) console.log(`⚠ ${w}`);
  for (const e of errors) console.log(`✖ ${e}`);
  if (errors.length) process.exit(1);
  console.log(
    `✔ ${Object.keys(registry).length} flags, ${brandIds().length} brands — no errors${warnings.length ? ` (${warnings.length} warnings)` : ''}`,
  );
}

switch (command) {
  case 'list':
    list();
    break;
  case 'on':
  case 'off':
    setValue(key, command === 'on');
    break;
  case 'set':
    setValue(key, parseValue(rawValue));
    break;
  case 'unset': {
    requireKnown(key);
    const brands = targetBrands();
    if (!brands) fail('unset needs --brand <id|all> (the registry default cannot be unset)');
    for (const id of brands) {
      writeJson(brandFile(id), omit(readJson(brandFile(id)), key));
    }
    break;
  }
  case 'add': {
    if (!key || !KEY.test(key))
      fail(
        'Usage: npm run flags -- add <key> --description "…" [--kind module|runtime] [--default on|off|value]',
      );
    if (key in registry) fail(`Flag "${key}" already exists`);
    if (!args.description || args.description === true) fail('--description is required');
    const kind = args.kind ?? 'runtime';
    if (!['module', 'runtime'].includes(kind)) fail('--kind must be module or runtime');
    const def = {
      default: args.default === undefined ? false : parseValue(args.default),
      kind,
      description: args.description,
    };
    if (args.owner) def.owner = args.owner;
    if (args.requires)
      def.requires = String(args.requires)
        .split(',')
        .map((s) => s.trim());
    if (args.expires) def.expires = args.expires;
    for (const dep of def.requires ?? []) requireKnown(dep);
    writeJson(REGISTRY, { ...registry, [key]: def });
    console.log(
      `\n✔ Added "${key}". Use it: ${kind === 'module' ? `featureFlag: flag('${key}') in a module` : `useFlag('${key}')`}`,
    );
    break;
  }
  case 'remove': {
    requireKnown(key);
    const refs = codeReferences(key);
    writeJson(REGISTRY, omit(registry, key));
    for (const id of brandIds()) {
      const values = readJson(brandFile(id));
      if (key in values) {
        writeJson(brandFile(id), omit(values, key));
      }
    }
    if (refs.length)
      console.log(
        `\n⚠ Still referenced in:\n${refs.map((r) => `  - ${r}`).join('\n')}\nRemove those references (npm run typecheck will point at them).`,
      );
    break;
  }
  case 'doctor':
    doctor();
    break;
  default:
    fail(`Unknown command "${command}". Commands: list, on, off, set, unset, add, remove, doctor`);
}
