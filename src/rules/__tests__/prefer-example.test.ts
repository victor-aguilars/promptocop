import { describe, it, expect } from 'vitest';
import preferExample from '../prefer-example.js';

describe('prefer-example', () => {
  it('does not flag short prompts', () => {
    expect(preferExample.check('fix the bug').passed).toBe(true);
  });

  it('flags long prompts without examples', () => {
    const prompt = 'Rewrite the error messages throughout the application to be more user-friendly and less technical';
    expect(preferExample.check(prompt).passed).toBe(false);
  });

  it('passes with "for example"', () => {
    const prompt = 'Rewrite the error messages to be friendlier, for example "Could not connect" instead of "ECONNREFUSED"';
    expect(preferExample.check(prompt).passed).toBe(true);
  });

  it('passes with "e.g."', () => {
    const prompt = 'Update error messages to be user-friendly (e.g., plain English instead of error codes)';
    expect(preferExample.check(prompt).passed).toBe(true);
  });

  it('passes with a code block', () => {
    const prompt = 'Rewrite the error messages to be friendly:\n```\nCould not connect to server\n```';
    expect(preferExample.check(prompt).passed).toBe(true);
  });

  it('passes with backtick code', () => {
    const prompt = 'Replace the `ECONNREFUSED` error with a user-friendly message in the HTTP client';
    expect(preferExample.check(prompt).passed).toBe(true);
  });
});
