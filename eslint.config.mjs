// @ts-check
import { readFileSync, readdirSync } from 'node:fs';
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Architecture boundaries are derived from each package's declared @org/* dependencies,
 * so package.json is the single source of truth for the layer graph.
 */
const packageBoundaries = readdirSync('packages').map((name) => {
  const pkg = JSON.parse(readFileSync(`packages/${name}/package.json`, 'utf8'));
  const allowed = new Set(
    Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }).filter((d) =>
      d.startsWith('@org/'),
    ),
  );
  const forbidden = readdirSync('packages')
    .map((n) => `@org/${n}`)
    .filter(
      (d) => d !== pkg.name && !allowed.has(d) && !(pkg.name === '@org/di' && d === '@org/di'),
    );
  return {
    files: [`packages/${name}/src/**/*.{ts,tsx}`],
    ignores: [`packages/${name}/src/**/__tests__/**`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: forbidden.map((d) => ({
            name: d,
            message: `${pkg.name} may not depend on ${d} (add it to package.json deps if intended — check the layer diagram in docs/architecture.md).`,
          })),
          patterns: [
            {
              group: ['@org/*/src/*'],
              message: 'Import from the package entry point, not its internals.',
            },
          ],
        },
      ],
    },
  };
});

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.expo/**',
      '**/*.config.js',
      'scripts/templates/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked.map((c) => ({ ...c, files: ['**/*.{ts,tsx}'] })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.es2022 },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  ...packageBoundaries,
  {
    // Clean architecture: the domain layer is pure TypeScript — no UI, no I/O, no framework state.
    files: ['**/features/*/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'react-redux', '@reduxjs/*'],
              message: 'domain/ must stay framework-free.',
            },
            {
              group: ['@org/network', '@org/state', '@org/ui', '@org/storage', '@org/core'],
              message: 'domain/ defines ports; data/ implements them.',
            },
            {
              group: ['**/data/**', '**/presentation/**'],
              message: 'Dependencies point inward: presentation → domain ← data.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/features/*/data/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/presentation/**', 'react', 'react-native', '@org/ui'],
              message: 'data/ must not depend on presentation.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/__tests__/**', 'packages/testing/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  {
    files: ['**/*.mjs', '**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { globals: { ...globals.node } },
  },
);
