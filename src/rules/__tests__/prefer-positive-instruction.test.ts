import { describe, it, expect } from 'vitest';
import preferPositiveInstruction from '../prefer-positive-instruction.js';

describe('prefer-positive-instruction', () => {
  it('flags "don\'t use markdown"', () => {
    const result = preferPositiveInstruction.check("don't use markdown in your response");
    expect(result.passed).toBe(false);
  });

  it('flags "no markdown"', () => {
    expect(preferPositiveInstruction.check('Explain this. No markdown.').passed).toBe(false);
  });

  it('flags "avoid bullet points"', () => {
    expect(preferPositiveInstruction.check('avoid bullet points').passed).toBe(false);
  });

  it('flags "no bullet points"', () => {
    expect(preferPositiveInstruction.check('no bullet points please').passed).toBe(false);
  });

  it('flags "do not use headers"', () => {
    expect(preferPositiveInstruction.check('do not use headers').passed).toBe(false);
  });

  it('flags "don\'t use formatting"', () => {
    expect(preferPositiveInstruction.check("don't use formatting").passed).toBe(false);
  });

  it('does not flag "don\'t use jQuery"', () => {
    expect(preferPositiveInstruction.check("don't use jQuery, use vanilla JS").passed).toBe(true);
  });

  it('does not flag "don\'t add new files"', () => {
    expect(preferPositiveInstruction.check("don't add new files").passed).toBe(true);
  });

  it('passes a positive format instruction', () => {
    expect(preferPositiveInstruction.check('respond in plain prose paragraphs').passed).toBe(true);
  });

  it('passes a prompt with no format instruction', () => {
    expect(preferPositiveInstruction.check('Fix the auth bug in src/auth.ts').passed).toBe(true);
  });

  it('populates matched with the triggering text', () => {
    const result = preferPositiveInstruction.check("don't use markdown");
    expect(result.matched).toBeDefined();
  });
});
