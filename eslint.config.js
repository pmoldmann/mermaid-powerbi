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
            'test/**',
            '**/*webpack.config.js',
            'eslint.config.js',
            'assetProcessor.*',
            'traceOptions.ts',
            'src/license.ts',
            'src/LicenseRequired.tsx',
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
            '@typescript-eslint/no-empty-interface': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-var-requires': 'warn',
        },
    },
];
