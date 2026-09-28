import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const pascal = (s) => s.replace(/(^|[-_\s]+)(\w)/g, (_, __, c) => c.toUpperCase());
export const camel = (s) => pascal(s).replace(/^\w/, (c) => c.toLowerCase());
export const singular = (s) =>
  s.endsWith('ies') ? `${s.slice(0, -3)}y` : s.endsWith('s') ? s.slice(0, -1) : s;

/** `--key value` / `--flag` / positional parsing. */
export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else out[key] = argv[++i];
    } else out._.push(a);
  }
  return out;
}

export function writeFiles(baseDir, files, { force = false } = {}) {
  for (const [path, content] of Object.entries(files)) {
    const full = join(baseDir, path);
    if (existsSync(full) && !force)
      throw new Error(`Refusing to overwrite ${relative(ROOT, full)} (use --force)`);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content.replace(/^\n/, ''));
    console.log(`  + ${relative(ROOT, full)}`);
  }
}

/** Inserts `line` after the last line matching `after` (idempotent). */
export function insertAfterLast(file, after, line) {
  const src = readFileSync(file, 'utf8');
  if (src.includes(line)) return false;
  const lines = src.split('\n');
  let idx = -1;
  lines.forEach((l, i) => {
    if (after.test(l)) idx = i;
  });
  if (idx === -1) throw new Error(`Anchor ${after} not found in ${relative(ROOT, file)}`);
  lines.splice(idx + 1, 0, line);
  writeFileSync(file, lines.join('\n'));
  console.log(`  ~ ${relative(ROOT, file)}`);
  return true;
}

export function replaceIn(file, pattern, replacer) {
  const src = readFileSync(file, 'utf8');
  const next = src.replace(pattern, replacer);
  if (next === src) throw new Error(`Pattern ${pattern} not found in ${relative(ROOT, file)}`);
  writeFileSync(file, next);
  console.log(`  ~ ${relative(ROOT, file)}`);
}

export const fail = (msg) => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};
