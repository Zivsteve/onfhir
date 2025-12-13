import { Config } from 'jest';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '^~/(.*)$': ['<rootDir>/src/$1'],
  },
  modulePaths: ['<rootDir>'],
} as Config;
