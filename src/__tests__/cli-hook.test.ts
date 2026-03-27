import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';

const CLI = join(import.meta.dirname, '../../dist/cli.js');

function runHook(prompt: string, extraArgs: string[] = [], cwd?: string) {
  const input = JSON.stringify({ prompt });
  return spawnSync('node', [CLI, 'lint', '--hook', ...extraArgs, '-'], {
    input,
    encoding: 'utf8',
    cwd,
  });
}

function withConfig(dir: string, yaml: string, fn: () => void) {
  const path = join(dir, '.promptocop.yml');
  writeFileSync(path, yaml, 'utf8');
  try {
    fn();
  } finally {
    if (existsSync(path)) unlinkSync(path);
  }
}

describe('hook mode (default — non-blocking)', () => {
  it('exits 0 even when errors are found', () => {
    const result = runHook('fix it');
    expect(result.status).toBe(0);
  });

  it('writes JSON additionalContext to stdout on violations', () => {
    const result = runHook('fix it');
    expect(result.stdout.trim()).not.toBe('');
    const parsed = JSON.parse(result.stdout.trim()) as { additionalContext?: string };
    expect(parsed).toHaveProperty('additionalContext');
    expect(parsed.additionalContext).toContain('fix');
  });

  it('writes status to stderr', () => {
    const result = runHook('fix it');
    expect(result.stderr).toContain('[promptocop]');
  });

  it('exits 0 when rules only produce info/warn (never blocks)', () => {
    // Specific, well-formed prompt — may still trigger info-level prefer-example, but must not block
    const result = runHook(
      'Add debug logging to src/auth.ts so that each failed login attempt logs the username and timestamp. Do not log passwords.',
    );
    expect(result.status).toBe(0);
  });

  it('handles raw string stdin (non-JSON fallback) without crashing', () => {
    const result = spawnSync('node', [CLI, 'lint', '--hook', '-'], {
      input: 'fix the bug',
      encoding: 'utf8',
    });
    expect(result.status).toBeDefined();
    expect(result.status).not.toBeNull();
  });

  it('prints per-violation details to stderr by default', () => {
    const result = runHook('fix it');
    // Should include the rule name in stderr
    expect(result.stderr).toContain('no-vague-verb');
  });

  it('suppresses per-violation details when silent: true', () => {
    const tmpDir = join(import.meta.dirname, '../../');
    withConfig(tmpDir, 'silent: true\nextends:\n  - promptocop:recommended\n', () => {
      const result = runHook('fix it', [], tmpDir);
      // Summary line should still appear
      expect(result.stderr).toContain('[promptocop]');
      // But individual rule names should not
      expect(result.stderr).not.toContain('no-vague-verb');
    });
  });
});
