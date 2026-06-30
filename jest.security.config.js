export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  // Transform TS via ts-jest; JS via babel-jest to support ESM import syntax in tests
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
      },
    ],
    '^.+\\.jsx?$': ['babel-jest', { presets: ['@babel/preset-env'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
  ],
  // Do NOT collect coverage here to prevent scanning unrelated JS files
  collectCoverage: false,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
  // Map heavy modules to lightweight shims for this focused test run
  '^../middleware/errorHandler.js$': '<rootDir>/src/tests/shims/errorHandler.js',
  '^../middleware/auth.js$': '<rootDir>/src/tests/shims/auth.js',
  },
  testMatch: ['**/security-*.test.{js,ts}'],
  verbose: true,
};
