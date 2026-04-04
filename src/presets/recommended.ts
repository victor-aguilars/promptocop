import type { PromptocopConfig } from '../types.js';

export const recommended: PromptocopConfig = {
  rules: {
    'no-vague-verb': 'error',
    'no-ambiguous-pronoun': 'warn',
    'missing-success-criteria': 'error',
    'no-file-context': 'warn',
    'no-constraints': 'info',
    'multi-task': 'error',
    'context-dump-risk': 'warn',
    'prefer-example': 'info',
    'no-question-for-action': 'warn',
    'prefer-positive-instruction': 'info',
  },
};
