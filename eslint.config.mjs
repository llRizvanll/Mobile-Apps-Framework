// @ts-check
import { readFileSync } from 'node:fs';
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * ── Architecture boundaries ────────────────────────────────────────────────────────────────
 * src/framework/layers.json is the single source of truth for which framework modules may import
 * which. Flat config does not merge `no-restricted-imports` options across blocks, so each scope
 * below composes its full pattern list explicitly.
 */
const layers = JSON.parse(readFileSync('src/framework/layers.json', 'utf8')).modules;
const modules = Object.keys(layers);

const restrict = (...patterns) => ['error', { patterns }];

const NO_DEEP_FRAMEWORK = {
  group: ['@framework/*/*', '!@framework/di/react'],
  message:
    'Import a framework module from its entry point (@framework/<module>), not its internals.',
};
const NO_APP_LAYERS_IN_FRAMEWORK = {
  group: ['@app/*', '@features/*', '@brands/*', '@config/*'],
  message:
    'The framework must not depend on the app, features, brands or app config (dependencies point into the framework).',
};
const NO_ESCAPE = {
  group: ['../../*'],
  message:
    'Do not reach across modules with relative paths; use an alias (@framework/…, @features/…).',
};
const NO_SHELL_IN_FEATURES = {
  group: ['@app/*', '@brands/*'],
  message:
    'Features must not depend on the app shell or on specific brands (read brand data via useBrandConfig / BrandConfigToken).',
};
const NO_CROSS_FEATURE = {
  group: ['@features/*/domain/*', '@features/*/data/*', '@features/*/presentation/*'],
  message:
    "Don't reach into another feature's internals. Depend on its module/tokens, or promote shared code to the framework.",
};
const DOMAIN_RULES = [
  {
    group: ['react', 'react-native', 'react-redux', '@reduxjs/*'],
    message: 'domain/ must stay framework-free.',
  },
  {
    group: [
      '@framework/network',
      '@framework/state',
      '@framework/ui',
      '@framework/storage',
      '@framework/core',
    ],
    message: 'domain/ defines ports; data/ implements them.',
  },
  {
    group: ['**/data/**', '**/presentation/**'],
    message: 'Dependencies point inward: presentation → domain ← data.',
  },
];
const DATA_RULES = [
  {
    group: ['**/presentation/**', 'react', 'react-native', '@framework/ui'],
    message: 'data/ must not depend on presentation.',
  },
];

const frameworkBoundaries = modules.map((name) => {
  const allowed = new Set(layers[name].dependsOn);
  const forbidden = modules.filter((m) => m !== name && !allowed.has(m));
  return {
    files: [`src/framework/${name}/**/*.{ts,tsx}`],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: forbidden.map((m) => ({
            name: `@framework/${m}`,
            message: `framework/${name} may not depend on framework/${m}. If intended, add it to src/framework/layers.json and review docs/architecture.md.`,
          })),
          patterns: [NO_DEEP_FRAMEWORK, NO_APP_LAYERS_IN_FRAMEWORK, NO_ESCAPE],
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
  ...frameworkBoundaries,
  {
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': restrict(
        NO_DEEP_FRAMEWORK,
        NO_SHELL_IN_FEATURES,
        NO_CROSS_FEATURE,
        NO_ESCAPE,
      ),
    },
  },
  {
    // Clean architecture: the domain layer is pure TypeScript — no UI, no I/O, no framework state.
    files: ['src/features/*/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict(
        NO_DEEP_FRAMEWORK,
        NO_SHELL_IN_FEATURES,
        NO_CROSS_FEATURE,
        ...DOMAIN_RULES,
      ),
    },
  },
  {
    files: ['src/features/*/data/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict(
        NO_DEEP_FRAMEWORK,
        NO_SHELL_IN_FEATURES,
        NO_CROSS_FEATURE,
        ...DATA_RULES,
      ),
    },
  },
  {
    files: ['src/brands/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': restrict(NO_DEEP_FRAMEWORK, {
        group: ['@app/*', '@features/*'],
        message:
          'Brands are data + presentation overrides; they must not depend on the app shell or features.',
      }),
    },
  },
  {
    files: ['**/__tests__/**', 'src/framework/testing/**'],
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
