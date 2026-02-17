import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import astroPlugin from 'eslint-plugin-astro';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
    {
        ignores: ['dist/**', '.astro/**', '.wrangler/**', 'node_modules/**', '*.min.js', 'tests/**', 'helper_bot/**'],
    },
    {
        files: ['**/*.{js,mjs,ts}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-var': 'error',
            'prefer-const': ['warn', { destructuring: 'all' }],
            eqeqeq: ['warn', 'smart'],
            'no-debugger': 'error',
            'no-duplicate-imports': 'error',
        },
    },
    ...sveltePlugin.configs['flat/recommended'],
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parserOptions: {
                parser: tsparser,
            },
        },
        rules: {
            'svelte/no-at-html-tags': 'off',
            'svelte/valid-compile': 'off',
            'svelte/require-each-key': 'off',
            'svelte/prefer-svelte-reactivity': 'off',
            'svelte/no-dom-manipulating': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
    ...astroPlugin.configs['flat/recommended'],
    eslintConfigPrettier,
];
