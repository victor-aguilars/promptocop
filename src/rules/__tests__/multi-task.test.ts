import { describe, it, expect } from 'vitest';
import multiTask from '../multi-task.js';

describe('multi-task', () => {
  it('passes a single-task prompt', () => {
    expect(multiTask.check('add error handling to the fetchUser function').passed).toBe(true);
  });

  it('flags "and also" connector', () => {
    const result = multiTask.check('add error handling and also update the README');
    expect(result.passed).toBe(false);
  });

  it('flags "additionally"', () => {
    expect(multiTask.check('fix the auth bug. Additionally, update the tests.').passed).toBe(false);
  });

  it('flags "then" followed by an imperative verb', () => {
    expect(multiTask.check('fix the auth bug then deploy it').passed).toBe(false);
  });

  it('does not flag "then" without an imperative verb', () => {
    expect(multiTask.check('warm the cache, then invalidated after TTL').passed).toBe(true);
  });

  it('does not flag "also" used as a requirement, not a new task', () => {
    expect(multiTask.check('Add a search bar. Also, the results should be paginated.').passed).toBe(true);
  });

  it('flags "also" followed by an imperative verb', () => {
    expect(multiTask.check('Add error handling and also update the tests.').passed).toBe(false);
  });

  it('flags 3+ imperative sentences', () => {
    const prompt = 'Add error handling. Update the README. Fix the lint warnings. Remove dead code.';
    const result = multiTask.check(prompt);
    expect(result.passed).toBe(false);
  });

  it('does not flag 2 imperative sentences', () => {
    const prompt = 'Add a null check. Update the return type.';
    expect(multiTask.check(prompt).passed).toBe(true);
  });

  it('auto-fix produces a numbered list', () => {
    const prompt = 'Add error handling. Update the README. Fix the lint warnings. Remove dead code.';
    const fixed = multiTask.fix!(prompt);
    expect(fixed).toContain('1.');
    expect(fixed).toContain('2.');
  });
});
