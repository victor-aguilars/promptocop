import { describe, it, expect } from 'vitest';
import noConstraints from '../no-constraints.js';

describe('no-constraints', () => {
  it('flags a prompt with no constraints', () => {
    const result = noConstraints.check('add a caching layer');
    expect(result.passed).toBe(false);
  });

  it('passes with "must" constraint', () => {
    expect(noConstraints.check('add a cache that must not exceed 100 entries').passed).toBe(true);
  });

  it('passes with "only" constraint', () => {
    expect(noConstraints.check('use only the standard library').passed).toBe(true);
  });

  it('passes with "avoid" constraint', () => {
    expect(noConstraints.check('avoid modifying the database schema').passed).toBe(true);
  });

  it('passes with quantity limits', () => {
    expect(noConstraints.check('limit the results to at most 10 items').passed).toBe(true);
  });

  it('passes with bullet list', () => {
    const prompt = 'Add caching:\n- Max 100 entries\n- TTL 5 minutes';
    expect(noConstraints.check(prompt).passed).toBe(true);
  });

  it('passes with numbered list', () => {
    const prompt = 'Add caching:\n1. Max 100 entries\n2. TTL 5 minutes';
    expect(noConstraints.check(prompt).passed).toBe(true);
  });
});
