#!/usr/bin/env node
/**
 * Removes the example features so you start from a clean app:
 *   - src/features/todos, src/features/assistant (+ their tests)
 *   - their mock API routes (src/app/bootstrap/mockExamples.ts)
 *   - their feature flags (registry + brand features.json)
 *   - this script and its npm script
 * Kept: settings, devtools, the framework, brands, generators, CI.
 *
 *   npm run examples:remove            # dry run: shows what would change
 *   npm run examples:remove -- --yes   # do it
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, parseArgs } from './lib/util.mjs';

const args = parseArgs(process.argv.slice(2));
const apply = args.yes === true;
const FEATURES = ['todos', 'assistant'];
const MODULES = ['todosModule', 'assistantModule'];
const FLAGS = ['assistant', 'todos.showCompleted', 'todos'];

const rel = (p) => relative(ROOT, p);
const touched = [];
const plan = (msg) => console.log(`  ${apply ? '✔' : '·'} ${msg}`);
const edit = (file, fn) => {
  const before = readFileSync(file, 'utf8');
  const after = fn(before);
  if (after === before) return;
  plan(`edit   ${rel(file)}`);
  if (apply) writeFileSync(file, after);
  touched.push(file);
};
const remove = (path) => {
  if (!existsSync(path)) return;
  plan(`delete ${rel(path)}`);
  if (apply) rmSync(path, { recursive: true, force: true });
};

console.log(apply ? '\nRemoving example features…\n' : '\nDry run (add --yes to apply):\n');

for (const f of FEATURES) remove(join(ROOT, 'src/features', f));
remove(join(ROOT, 'src/app/bootstrap/mockExamples.ts'));

edit(join(ROOT, 'src/app/bootstrap/mockBackend.ts'), (s) =>
  s.replace(/^[ \t]*\/\/ <examples>[\s\S]*?\/\/ <\/examples>[ \t]*\n/gm, ''),
);

edit(join(ROOT, 'src/app/modules.ts'), (s) => {
  let out = s;
  for (const f of FEATURES)
    out = out.replace(new RegExp(`^import .* from '@features/${f}/module';\\n`, 'm'), '');
  for (const m of MODULES) out = out.replace(new RegExp(`\\s*\\b${m},?`, 'g'), '');
  return out;
});

const dropFlags = (file) =>
  edit(file, (s) => {
    const json = JSON.parse(s);
    for (const k of FLAGS) delete json[k];
    return `${JSON.stringify(json, null, 2)}\n`;
  });
dropFlags(join(ROOT, 'src/config/feature-flags.json'));
for (const b of readdirSync(join(ROOT, 'src/brands'), { withFileTypes: true })) {
  const file = join(ROOT, 'src/brands', b.name, 'features.json');
  if (b.isDirectory() && existsSync(file)) dropFlags(file);
}

edit(join(ROOT, 'package.json'), (s) => {
  const pkg = JSON.parse(s);
  delete pkg.scripts['examples:remove'];
  return `${JSON.stringify(pkg, null, 2)}\n`;
});
remove(join(ROOT, 'scripts/remove-examples.mjs'));

if (!apply) {
  console.log('\nNothing changed. Run: npm run examples:remove -- --yes\n');
  process.exit(0);
}
execSync(`npx prettier --write ${touched.map((f) => JSON.stringify(f)).join(' ')}`, {
  stdio: 'ignore',
  cwd: ROOT,
});
console.log(`
✔ Done. Next:
  npm run verify && npm run flags -- doctor
  npm run gen:feature -- <your-first-feature> --flag --on
(The docs still mention the todos example as a pattern; it remains in git history.)
`);
