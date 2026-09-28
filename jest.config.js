/**
 * Two projects:
 *  - unit:   pure TypeScript logic (*.test.ts) in Node — fast, no RN runtime.
 *  - native: components/hooks/integration (*.test.tsx) with the React Native preset.
 * Aliases mirror tsconfig.json `paths`.
 * @type {import('jest').Config}
 */
const shared = {
  moduleNameMapper: {
    '^@framework/(.*)$': '<rootDir>/src/framework/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@brands/(.*)$': '<rootDir>/src/brands/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@reduxjs|immer|redux|react-redux|reselect)/)',
  ],
};

module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
    },
    {
      ...shared,
      displayName: 'native',
      preset: '@react-native/jest-preset',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.tsx'],
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/index.ts',
    '!src/app/bootstrap/adapters.ts',
  ],
};
