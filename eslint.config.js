import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { defineConfig, globalIgnores } from 'eslint/config'

const tsFlatConfigs = tseslint.configs['flat/recommended'].map((config) => ({
  ...config,
  files: ['src/**/*.{ts,tsx}', 'api/**/*.ts', 'tests/**/*.ts'],
}))

export default defineConfig([
  globalIgnores([
    'dist',
    'dist-ssr',
    'build',
    'coverage',
    'node_modules',
    '*.min.js',
    '*.log',
    '*.local',
    '*.tmp',
    '*.cache',
    '*.cache/**',
    '.vite',
    '.vite/**',
    'tmp',
    'tmp/**',
    'public',
    'public/**',
    '*.tsbuildinfo',
    '.env*',
    'src/types/supabase.ts',
  ]),
  ...tsFlatConfigs,
  {
    files: [
      'src/**/*.{js,jsx,ts,tsx}',
      'api/**/*.ts',
      'tests/**/*.ts',
    ],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' },
      ],
    },
  },
  {
    files: [
      '*.config.{js,ts}',
      '*.{config,setup}.ts',
      'vite.config.ts',
      'vitest.config.ts',
      'tailwind.config.js',
      'postcss.config.js',
      'eslint.config.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        project: false,
      },
    },
  },
])
