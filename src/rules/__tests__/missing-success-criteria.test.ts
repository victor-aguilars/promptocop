import { describe, it, expect } from 'vitest';
import missingSuccessCriteria from '../missing-success-criteria.js';

describe('missing-success-criteria', () => {
  it('passes short prompts regardless', () => {
    expect(missingSuccessCriteria.check('fix bug').passed).toBe(true);
  });

  it('flags long prompts with no success language', () => {
    const prompt = 'Add authentication to the API endpoints in the application';
    expect(missingSuccessCriteria.check(prompt).passed).toBe(false);
  });

  it('passes with "so that" clause', () => {
    const prompt = 'Add authentication to the API so that unauthenticated requests return 401';
    expect(missingSuccessCriteria.check(prompt).passed).toBe(true);
  });

  it('passes with "verify that"', () => {
    const prompt = 'Add authentication to the API endpoints and verify that existing tests still pass';
    expect(missingSuccessCriteria.check(prompt).passed).toBe(true);
  });

  it('passes with "should return"', () => {
    const prompt = 'Add a parseDate function to utils.ts that should return a Date object or null';
    expect(missingSuccessCriteria.check(prompt).passed).toBe(true);
  });

  it('passes with "the test should pass"', () => {
    const prompt = 'Fix the race condition in the event loop so the test should pass';
    expect(missingSuccessCriteria.check(prompt).passed).toBe(true);
  });

  it('passes with "ensure that"', () => {
    const prompt = 'Add rate limiting to the API endpoints and ensure that requests over the limit return 429';
    expect(missingSuccessCriteria.check(prompt).passed).toBe(true);
  });
});
