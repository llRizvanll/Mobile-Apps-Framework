#!/usr/bin/env node
/**
 * Copies packages/*\/README.md into docs/reference/packages/*.md (with SEO frontmatter) so the docs
 * site has a package reference without duplicating content in git. Run by `npm run docs:*`.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/util.mjs';

const out = join(ROOT, 'docs', 'reference', 'packages');
mkdirSync(out, { recursive: true });
const REPO = 'https://github.com/llRizvanll/Mobile-Apps-Framework';

for (const name of readdirSync(join(ROOT, 'packages'))) {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'packages', name, 'package.json'), 'utf8'));
  const readme = readFileSync(join(ROOT, 'packages', name, 'README.md'), 'utf8');
  const description = `${pkg.name}: ${pkg.description} Part of the white-label, AI-native React Native framework.`;
  const source = `\n\n---\n\n[Source on GitHub](${REPO}/tree/main/packages/${name}) · depends on: ${
    Object.keys(pkg.dependencies ?? {})
      .filter((d) => d.startsWith('@org/'))
      .map((d) => `\`${d}\``)
      .join(', ') || 'nothing'
  }\n`;
  writeFileSync(
    join(out, `${name}.md`),
    `---\ntitle: '${pkg.name}'\neditLink: false\ndescription: '${description.replace(/'/g, "''")}'\n---\n\n::: v-pre\n${readme}\n:::\n${source}`,
  );
}
console.log(`synced ${readdirSync(out).length} package pages`);
