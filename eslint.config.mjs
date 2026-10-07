import js from '@eslint/js'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import react from 'eslint-plugin-react'

export default [
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off'
    }
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'scripts/_legacy/**',
      'app/(payload)/admin/importMap.js',
      'payload-types.ts',
      'migrations/**',
      'next-env.d.ts'
    ]
  },
  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  // eslint-config-next registers the react plugin; take only the rules here.
  { rules: react.configs.flat.recommended.rules },
  prettier,
  {
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-unused-vars': [
        2,
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'react/prop-types': 0,
      'react/react-in-jsx-scope': 0,
      'react/jsx-uses-react': 0
    }
  }
]
