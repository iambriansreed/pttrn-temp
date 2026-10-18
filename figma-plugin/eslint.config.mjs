import js from '@eslint/js';
import * as figmaPlugins from '@figma/eslint-plugin-figma-plugins';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default defineConfig([
    // The compiled plugin files in the package root are build output.
    globalIgnores(['node_modules/', 'code.js', 'ui.js', 'ui.html']),
    js.configs.recommended,
    ...tsEslint.configs.recommended,
    {
        // The plugin's main thread and panel. The Figma rules need type information.
        files: ['src/**/*.ts'],
        languageOptions: {
            parserOptions: { project: './tsconfig.json', tsconfigRootDir: import.meta.dirname },
        },
        plugins: figmaPlugins.flatConfigs.recommended.plugins,
        rules: {
            ...figmaPlugins.flatConfigs.recommended.rules,
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
            ],
        },
    },
    { files: ['src/ui.ts'], languageOptions: { globals: globals.browser } },
    { files: ['scripts/**/*.mjs', 'tests/**/*.mjs'], languageOptions: { globals: globals.node } },
    eslintConfigPrettier,
]);
