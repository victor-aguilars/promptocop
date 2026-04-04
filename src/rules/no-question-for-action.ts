import type { Rule, RuleResult } from '../types.js';

const INDIRECT_PREFIXES = /^(can you|could you|would you|will you)\s+/i;

// Information verbs — legitimate question uses, should not be flagged
const INFO_VERBS = new Set([
  'explain', 'tell', 'describe', 'show', 'list', 'summarize', 'summarise',
  'help', 'clarify', 'walk', 'give', 'provide', 'suggest', 'recommend',
  'confirm', 'verify', 'let',
]);

// Action verbs — these should be direct instructions, not questions
const ACTION_VERBS = new Set([
  'fix', 'add', 'update', 'create', 'write', 'build', 'remove', 'delete',
  'refactor', 'move', 'rename', 'implement', 'deploy', 'run', 'test',
  'change', 'enable', 'disable', 'install', 'configure', 'generate',
  'expose', 'hide', 'make', 'set', 'get', 'modify', 'rewrite', 'migrate',
  'convert', 'extract', 'replace', 'merge', 'split', 'review', 'debug',
  'check', 'send', 'read', 'write', 'open', 'close', 'parse', 'validate',
]);

const noQuestionForAction: Rule = {
  name: 'no-question-for-action',
  description: 'Indirect action request phrased as a question — use a direct instruction instead',
  severity: 'warn',

  check(prompt: string): RuleResult {
    const match = INDIRECT_PREFIXES.exec(prompt);
    if (!match) return { passed: true };

    const rest = prompt.slice(match[0].length).trim();
    const firstWord = /^([a-zA-Z]+)/.exec(rest)?.[1]?.toLowerCase();
    if (!firstWord) return { passed: true };

    if (INFO_VERBS.has(firstWord)) return { passed: true };

    if (ACTION_VERBS.has(firstWord)) {
      return {
        passed: false,
        message: `"${match[0].trim()}" makes this a question — rephrase as a direct instruction`,
        matched: match[0].trim(),
      };
    }

    return { passed: true };
  },

  fix(prompt: string): string {
    const match = INDIRECT_PREFIXES.exec(prompt);
    if (!match) return prompt;
    const rest = prompt.slice(match[0].length);
    return rest.charAt(0).toUpperCase() + rest.slice(1);
  },

  directive(result): string {
    const prefix = result.matched ?? 'Can you';
    return `Rephrase as a direct instruction — instead of "${prefix} ...", state what you want done directly (e.g. "Fix the bug" instead of "Can you fix the bug?").`;
  },

  explain(): string {
    return `no-question-for-action

Phrasing a request as a question ("Can you fix X?") instead of a direct
instruction ("Fix X") can cause Claude to respond with suggestions rather
than taking action, since it interprets the question as asking for consent
or exploring options rather than doing the work.

Bad:  "Can you fix the auth bug?"
Bad:  "Could you update the README?"
Bad:  "Would you refactor this module?"
Good: "Fix the auth bug."
Good: "Update the README."
Good: "Refactor this module."

Does not flag information questions:
  "Can you explain how this works?" — asking for information, not action.
  "Could you summarize these changes?" — asking for output, not action.

Auto-fix: removes the indirect prefix and capitalizes the remainder.`;
  },
};

export default noQuestionForAction;
