/* eslint-disable */
export default {
  displayName: 'common',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  testTimeout: 120000,
  coverageDirectory: '../../coverage/libs/common',
  globalSetup: '<rootDir>/test/global-setup.helper.ts',
  globalTeardown: '<rootDir>/test/global-teardown.helper.ts',
};
