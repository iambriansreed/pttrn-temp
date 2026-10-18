import cspellESLintPluginRecommended from '@cspell/eslint-plugin/recommended';
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default defineConfig([
    {
        files: ['src/**/*.{ts,tsx}', 'build.ts', '.scripts/**/*', 'eslint.config.js'],
    },
    {
        settings: {
            'import/resolver': {
                node: true,
                typescript: true,
            },
            react: {
                version: 'detect',
            },
        },
        languageOptions: { globals: globals.browser },
    },
    js.configs.recommended,
    ...tsEslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    importPlugin.flatConfigs.recommended,
    jsxA11y.flatConfigs.recommended,
    eslintConfigPrettier,
    cspellESLintPluginRecommended,
    globalIgnores([
        'node_modules/**',
        '.github',
        'dist/',
        '*/.tmp/',
        'playwright-report/',
        'test-results/',
        'blob-report/',
    ]),
    {
        plugins: { 'react-hooks': reactHooks },

        rules: {
            'no-restricted-imports': 0, // different from UI

            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    disallowTypeAnnotations: true,
                    fixStyle: 'inline-type-imports',
                    prefer: 'no-type-imports',
                },
            ],
            '@typescript-eslint/member-ordering': 'error',
            '@typescript-eslint/sort-type-constituents': 'error',
            '@typescript-eslint/no-explicit-any': 'off',

            'react/jsx-no-useless-fragment': 'error',
            'react/self-closing-comp': 'error',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react/no-unused-prop-types': 'error',
            'react/no-multi-comp': 'error',
            'react/no-unknown-property': ['warn', { ignore: ['css'] }],
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/jsx-curly-brace-presence': ['warn', { children: 'never', props: 'never' }],
            'react/jsx-sort-props': 'warn',

            'no-restricted-syntax': ['error', { selector: 'TSEnumDeclaration', message: "Don't declare enums" }],
            'no-alert': 'error',
            'no-console': 0, // different from UI
            'no-debugger': 'error',
            'no-shadow': 'warn',
            'no-template-curly-in-string': 'error',
            'prefer-template': 'warn',

            'import/first': 'warn',
            'import/newline-after-import': 'warn',
            'import/no-absolute-path': 'warn',
            'import/no-duplicates': 'error',
            'import/no-empty-named-blocks': 'warn',
            'import/no-unresolved': 'off',
            'import/named': 'off',
            'import/order': ['warn', { alphabetize: { order: 'asc' } }],

            '@cspell/spellchecker': [
                'error',
                { configFile: new URL('./cspell.config.yaml', import.meta.url).toString() },
            ],
        },
    },
]);
