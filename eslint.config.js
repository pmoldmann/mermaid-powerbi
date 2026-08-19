// ESLint v9+ flat config — migrated from .eslintrc.js
// eslint-plugin-powerbi-visuals already ships a flat config for its recommended preset.
const powerbivisualsPlugin = require('eslint-plugin-powerbi-visuals');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const path = require('path');

module.exports = [
    // Files to ignore (replaces .eslintignore)
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'lib/**',
            '.tmp/**',
            'coverage/**',
            '**/*webpack.config.js',
            'vitest.config.ts',
            'eslint.config.js',
            'assetProcessor.*',
            'traceOptions.ts',
            'src/license.ts',
            'src/LicenseRequired.tsx',
            'src/visualPluginView.ts',
            'karma.conf.ts',
            'visuals-license-engine/**',
        ],
    },

    // Plugin recommended config (includes TypeScript parser + browser globals)
    powerbivisualsPlugin.configs.recommended,

    // Project-specific overrides: point parser at local tsconfig + register @typescript-eslint rules
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: path.resolve(__dirname),
            },
        },
        rules: {
            // Enable @typescript-eslint rules referenced in eslint-disable comments in source files
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-empty-object-type': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-var-requires': 'warn',
            // Empty interface is intentional for extensible React prop types
            '@typescript-eslint/no-empty-object-type': ['warn', { allowInterfaces: 'always' }],
        },
    },
    // Test code: the powerbi-visuals certification rules target shipped visual
    // code (no innerHTML, no eval, …). Tests deliberately build fake DOM and
    // DataView structures, so those rules do not apply here.
    {
        files: ['test/**/*.ts', 'test/**/*.tsx'],
        rules: {
            'powerbi-visuals/no-inner-outer-html': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            // SafeLink.test.tsx asserts that http: URLs are handled — the fixture
            // strings are test data, not links the visual ships.
            'powerbi-visuals/no-http-string': 'off',
        },
    },
    // dax-language.ts uses require() intentionally (ESM-only refractor module)
    {
        files: ['src/dax-language.ts'],
        rules: {
            '@typescript-eslint/no-var-requires': 'off',
        },
    },
];
