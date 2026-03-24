import { describe, it, expect } from 'vitest';
import noFileContext from '../no-file-context.js';

describe('no-file-context', () => {
  it('flags a prompt with no file reference', () => {
    const result = noFileContext.check('add error handling');
    expect(result.passed).toBe(false);
  });

  it('passes when a file path is present', () => {
    expect(noFileContext.check('fix src/auth.ts').passed).toBe(true);
  });

  it('passes when a relative path is present', () => {
    expect(noFileContext.check('update ./config/settings.json').passed).toBe(true);
  });

  it('passes when a file extension is mentioned', () => {
    expect(noFileContext.check('update the .env file').passed).toBe(true);
  });

  it('passes when a backtick identifier with extension is present', () => {
    expect(noFileContext.check('look at `auth.ts`').passed).toBe(true);
  });

  it('passes when "the X file" phrase is present', () => {
    expect(noFileContext.check('update the auth module').passed).toBe(true);
  });

  it('passes for "the X function" phrasing', () => {
    expect(noFileContext.check('debug the validateToken function').passed).toBe(true);
  });
});
