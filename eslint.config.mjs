import { ts } from '@darkobits/eslint-plugin';
import globals from 'globals';

export default [
  ...ts,
  {
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    rules: {
      // We don't actually use classes in this project, but ESLint's inference
      // detects that we are, and causes this rule to throw false-positives.
      '@typescript-eslint/unbound-method': 'off'
    }
  }
];
