import type { PromptcopConfig } from '../types.js';

export const recommended: PromptcopConfig = {
  rules: {
    'no-vague-verb': 'error',
    'no-ambiguous-pronoun': 'error',
    'missing-success-criteria': 'error',
    'no-file-context': 'warn',
    'no-constraints': 'warn',
    'multi-task': 'error',
    'context-dump-risk': 'warn',
    'prefer-example': 'info',
  },
};
