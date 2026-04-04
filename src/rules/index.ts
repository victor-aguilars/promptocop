import type { Rule } from '../types.js';
import noVagueVerb from './no-vague-verb.js';
import noAmbiguousPronoun from './no-ambiguous-pronoun.js';
import missingSucessCriteria from './missing-success-criteria.js';
import noFileContext from './no-file-context.js';
import noConstraints from './no-constraints.js';
import multiTask from './multi-task.js';
import contextDumpRisk from './context-dump-risk.js';
import preferExample from './prefer-example.js';
import noQuestionForAction from './no-question-for-action.js';
import preferPositiveInstruction from './prefer-positive-instruction.js';

export const rules: Rule[] = [
  noVagueVerb,
  noAmbiguousPronoun,
  missingSucessCriteria,
  noFileContext,
  noConstraints,
  multiTask,
  contextDumpRisk,
  preferExample,
  noQuestionForAction,
  preferPositiveInstruction,
];

export function getRuleByName(name: string): Rule | undefined {
  return rules.find((r) => r.name === name);
}
