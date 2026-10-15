import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'android', 'node_modules'] },

  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // App source: React + architectural boundaries
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: 'tsconfig.json' },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'module', pattern: 'src/modules/*', capture: ['feature'] },
        { type: 'entity', pattern: 'src/entities/*', capture: ['entity'] },
        { type: 'shared', pattern: 'src/shared/*', capture: ['segment'] },
        { type: 'root', pattern: 'src/*.{ts,tsx}' },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Layer direction — import only descends: app > module > entity > shared.
      // A module may import within its own feature; an entity within its own entity.
      // TODO: also forbid deep imports (bypassing index.ts) once migrated to the
      //       v7 file-selector API for boundaries/dependencies.
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'root' } },
              allow: {
                to: {
                  element: { types: { anyOf: ['app', 'module', 'entity', 'shared', 'root'] } },
                },
              },
            },
            {
              from: { element: { type: 'app' } },
              allow: {
                to: { element: { types: { anyOf: ['app', 'module', 'entity', 'shared'] } } },
              },
            },
            {
              from: { element: { type: 'module' } },
              allow: { to: { element: { types: { anyOf: ['entity', 'shared'] } } } },
            },
            {
              from: { element: { type: 'module' } },
              allow: {
                to: {
                  element: { type: 'module', captured: { feature: '{{from.captured.feature}}' } },
                },
              },
            },
            {
              from: { element: { type: 'entity' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            {
              from: { element: { type: 'entity' } },
              allow: {
                to: {
                  element: { type: 'entity', captured: { entity: '{{from.captured.entity}}' } },
                },
              },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
          ],
        },
      ],
    },
  },

  // Dexie é detalhe de shared/db; o resto do app usa a API de @/shared/db
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/shared/db/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'dexie', message: 'Dexie só dentro de src/shared/db — use @/shared/db.' },
          ],
        },
      ],
    },
  },
  // Tests: relax boundaries, allow deep imports
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: { 'boundaries/dependencies': 'off' },
  },

  // Config files run in Node
  {
    files: ['*.{ts,js}'],
    languageOptions: { globals: { ...globals.node } },
  },
)
