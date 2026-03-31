import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Mock homedir() so tests never touch ~/.claude or ~/.cursor
let tempHome: string;

vi.mock('node:os', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:os')>();
  return {
    ...original,
    homedir: () => tempHome,
  };
});

// Import after mock is set up
const { install, uninstall } = await import('../install.js');

beforeEach(() => {
  tempHome = mkdtempSync(join(tmpdir(), 'promptocop-skill-test-'));
});

afterEach(() => {
  rmSync(tempHome, { recursive: true, force: true });
  vi.resetModules();
});

describe('install (claude, personal)', () => {
  it('creates SKILL.md at ~/.claude/skills/promptocop/', () => {
    install('personal', 'claude');
    const skillPath = join(tempHome, '.claude', 'skills', 'promptocop', 'SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
  });

  it('writes non-empty SKILL.md content', () => {
    install('personal', 'claude');
    const content = readFileSync(
      join(tempHome, '.claude', 'skills', 'promptocop', 'SKILL.md'),
      'utf8',
    );
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('name: promptocop');
  });

  it('is idempotent — does not overwrite if already installed', () => {
    install('personal', 'claude');
    const skillPath = join(tempHome, '.claude', 'skills', 'promptocop', 'SKILL.md');
    const mtimeBefore = statSync(skillPath).mtimeMs;

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    install('personal', 'claude');
    consoleSpy.mockRestore();

    const mtimeAfter = statSync(skillPath).mtimeMs;
    expect(mtimeAfter).toBe(mtimeBefore);
  });
});

describe('uninstall (claude, personal)', () => {
  it('removes SKILL.md and parent directory when empty', () => {
    install('personal', 'claude');
    uninstall('personal', 'claude');
    const skillPath = join(tempHome, '.claude', 'skills', 'promptocop', 'SKILL.md');
    expect(existsSync(skillPath)).toBe(false);
  });

  it('prints not-installed message when skill is absent', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    uninstall('personal', 'claude');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not installed'));
    consoleSpy.mockRestore();
  });
});

describe('install (cursor, personal)', () => {
  it('creates SKILL.md at ~/.cursor/skills/promptocop/', () => {
    install('personal', 'cursor');
    const skillPath = join(tempHome, '.cursor', 'skills', 'promptocop', 'SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
  });

  it('does not write to claude directory', () => {
    install('personal', 'cursor');
    const claudePath = join(tempHome, '.claude', 'skills', 'promptocop', 'SKILL.md');
    expect(existsSync(claudePath)).toBe(false);
  });

  it('is idempotent — does not overwrite if already installed', () => {
    install('personal', 'cursor');
    const skillPath = join(tempHome, '.cursor', 'skills', 'promptocop', 'SKILL.md');
    const mtimeBefore = statSync(skillPath).mtimeMs;

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    install('personal', 'cursor');
    consoleSpy.mockRestore();

    const mtimeAfter = statSync(skillPath).mtimeMs;
    expect(mtimeAfter).toBe(mtimeBefore);
  });
});

describe('uninstall (cursor, personal)', () => {
  it('removes SKILL.md from cursor skills directory', () => {
    install('personal', 'cursor');
    uninstall('personal', 'cursor');
    const skillPath = join(tempHome, '.cursor', 'skills', 'promptocop', 'SKILL.md');
    expect(existsSync(skillPath)).toBe(false);
  });

  it('does not affect claude skills directory', () => {
    install('personal', 'claude');
    install('personal', 'cursor');
    uninstall('personal', 'cursor');
    const claudePath = join(tempHome, '.claude', 'skills', 'promptocop', 'SKILL.md');
    expect(existsSync(claudePath)).toBe(true);
  });
});
