/**
 * Two projects:
 *  - unit:   pure TypeScript logic (*.test.ts) in a Node environment — fast, no RN runtime.
 *  - native: React / React Native components & hooks (*.test.tsx) using the RN Jest preset.
 * @type {import('jest').Config}
 */
const shared = {
  moduleNameMapper: {
    '^@org/([a-z-]+)$': '<rootDir>/packages/$1/src',
    '^@brands/([a-z0-9-]+)$': '<rootDir>/brands/$1/src',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@reduxjs|immer|redux|react-redux|reselect)/)',
  ],
};

module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/{packages,brands,apps}/*/src/**/__tests__/**/*.test.ts'],
    },
    {
      ...shared,
      displayName: 'native',
      preset: '@react-native/jest-preset',
      testMatch: ['<rootDir>/{packages,brands,apps}/*/src/**/__tests__/**/*.test.tsx'],
    },
  ],
  collectCoverageFrom: ['packages/*/src/**/*.{ts,tsx}', '!**/__tests__/**', '!**/index.ts'],
};
