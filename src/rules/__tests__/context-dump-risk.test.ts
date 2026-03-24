import { describe, it, expect } from 'vitest';
import contextDumpRisk from '../context-dump-risk.js';

describe('context-dump-risk', () => {
  it('passes short clean prompts', () => {
    expect(contextDumpRisk.check('fix the auth bug in src/auth.ts').passed).toBe(true);
  });

  it('flags prompts exceeding max length', () => {
    const prompt = 'a'.repeat(2001);
    const result = contextDumpRisk.check(prompt);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('2001 chars');
  });

  it('flags large code blocks', () => {
    const block = '```\n' + 'x'.repeat(501) + '\n```';
    const result = contextDumpRisk.check('here is the code: ' + block);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('code block');
  });

  it('flags pasted stack traces', () => {
    const trace = `Fix this error:
Exception: NullPointerException
    at com.example.Auth.validate(Auth.java:42)
    at com.example.Main.run(Main.java:12)`;
    const result = contextDumpRisk.check(trace);
    expect(result.passed).toBe(false);
  });

  it('passes short code blocks', () => {
    const short = '```\nconst x = 1;\n```';
    expect(contextDumpRisk.check('example: ' + short).passed).toBe(true);
  });
});
