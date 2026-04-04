import { describe, it, expect } from 'vitest';
import noQuestionForAction from '../no-question-for-action.js';

describe('no-question-for-action', () => {
  it('flags "Can you fix"', () => {
    const result = noQuestionForAction.check('Can you fix the auth bug?');
    expect(result.passed).toBe(false);
    expect(result.message).toContain('direct instruction');
  });

  it('flags "Could you update"', () => {
    expect(noQuestionForAction.check('Could you update the README?').passed).toBe(false);
  });

  it('flags "Would you refactor"', () => {
    expect(noQuestionForAction.check('Would you refactor this module?').passed).toBe(false);
  });

  it('flags "Will you deploy"', () => {
    expect(noQuestionForAction.check('Will you deploy the app?').passed).toBe(false);
  });

  it('does not flag "Can you explain"', () => {
    expect(noQuestionForAction.check('Can you explain how this works?').passed).toBe(true);
  });

  it('does not flag "Can you summarize"', () => {
    expect(noQuestionForAction.check('Can you summarize these changes?').passed).toBe(true);
  });

  it('does not flag a direct instruction', () => {
    expect(noQuestionForAction.check('Fix the auth bug').passed).toBe(true);
  });

  it('does not flag a non-matching question', () => {
    expect(noQuestionForAction.check('What does the validateToken function do?').passed).toBe(true);
  });

  it('auto-fix removes the indirect prefix and capitalizes', () => {
    expect(noQuestionForAction.fix!('Can you fix the auth bug?')).toBe('Fix the auth bug?');
  });

  it('auto-fix handles "Could you"', () => {
    expect(noQuestionForAction.fix!('Could you update the README')).toBe('Update the README');
  });

  it('populates matched with the indirect prefix', () => {
    const result = noQuestionForAction.check('Can you fix the auth bug?');
    expect(result.matched).toBe('Can you');
  });

  it('directive interpolates the matched prefix', () => {
    const result = noQuestionForAction.check('Can you fix the auth bug?');
    const msg = noQuestionForAction.directive!(result);
    expect(msg).toContain('"Can you');
  });
});
