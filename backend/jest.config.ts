import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { diagnostics: false }],
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/test/'],
  moduleNameMapper: {
    '^.*/database/database$': '<rootDir>/test/helpers/mock-database.ts',
    '^postgres$': '<rootDir>/test/helpers/mock-postgres.ts',
    '^drizzle-orm/postgres-js$': '<rootDir>/test/helpers/mock-drizzle.ts',
  },
};

export default config;
