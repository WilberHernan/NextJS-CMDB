import neostandard, { resolveIgnoresFromGitignore } from 'neostandard';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  ...neostandard({
    ts: true,
    semi: true,
    ignores: resolveIgnoresFromGitignore(),
  }),
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // ── Overly strict in JSX — disable ──
      'react/jsx-handler-names': 'off',
      '@stylistic/multiline-ternary': 'off',

      // ── Useful rules we want ──
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
