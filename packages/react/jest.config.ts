import { Config } from 'jest';
import { TS_EXT_TO_TREAT_AS_ESM, ESM_TS_TRANSFORM_PATTERN } from 'ts-jest';

const config: Config = {
    testEnvironment: 'jsdom',
    // Only *.test files are suites; a component's spec.ts is data the suites import.
    testMatch: ['**/*.test.[jt]s?(x)'],
    extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
        [ESM_TS_TRANSFORM_PATTERN]: [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    moduleNameMapper: {
        '-/components/(.*)': '<rootDir>/src/components/$1',
        '-/styles/(.*)': '<rootDir>/src/styles/$1',
        '-/hooks/(.*)': '<rootDir>/src/hooks/$1',
        '-/utils/(.*)': '<rootDir>/src/utils/$1',
        '-/rtl/(.*)': '<rootDir>/src/rtl/$1',
        '-/types/(.*)': '<rootDir>/src/types/$1',
        '-/constants/(.*)': '<rootDir>/src/constants/$1',
        '\\.(css|scss)$': 'identity-obj-proxy',
    },
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', 'tests'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    transformIgnorePatterns: ['/node_modules/jest-axe', '/node_modules/@ptrn/react'],
};

export default config;
