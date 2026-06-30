export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.{js,ts,tsx}', '**/?(*.)+(spec|test).{js,ts,tsx}'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
  useESM: true,
  tsconfig: '<rootDir>/tsconfig.jest.json',
        isolatedModules: true,
      },
    ],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/dist/'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/dist/',
    '/node_modules/'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.test.{js,ts,tsx}',
    '!src/**/*.spec.{js,ts,tsx}',
    '!**/node_modules/**',
    '!src/migrations/**',
    '!src/setup/**',
    '!src/frontend/**',
    '!coverage/**',
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Specific thresholds for critical services
    './src/services/collaborationService.js': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    './src/services/portfolioService.js': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    './src/routes/profileEnhancement.js': {
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  testTimeout: 30000,
  moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@tests/(.*)$': '<rootDir>/src/tests/$1',
    // Allow tests importing "*.js" to resolve to TS source during Jest runs
    '^(.*)\\.js$': '$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json'],
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  verbose: true,
};
