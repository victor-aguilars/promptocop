import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { generateSkillContent } from './generate.js';

const SKILL_DIR_NAME = 'promptocop';
const SKILL_FILE_NAME = 'SKILL.md';

function skillPath(scope: 'personal' | 'project'): string {
  const base = scope === 'project'
    ? join(process.cwd(), '.claude', 'skills')
    : join(homedir(), '.claude', 'skills');
  return join(base, SKILL_DIR_NAME, SKILL_FILE_NAME);
}

export function install(scope: 'personal' | 'project' = 'personal'): void {
  const path = skillPath(scope);

  if (existsSync(path)) {
    console.log(`promptocop skill is already installed at ${path}`);
    return;
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, generateSkillContent(), 'utf8');

  console.log(`promptocop skill installed at ${path}`);
  console.log('Claude will now review prompts using AI reasoning — no shell execution required.');
  console.log('Note: if the promptocop hook is also installed, both will run. Use `promptocop hook uninstall` to remove the shell hook.');
}

export function uninstall(scope: 'personal' | 'project' = 'personal'): void {
  const path = skillPath(scope);

  if (!existsSync(path)) {
    console.log('promptocop skill is not installed.');
    return;
  }

  unlinkSync(path);

  // Remove the parent directory only if it is now empty
  try {
    rmdirSync(dirname(path));
  } catch {
    // Directory not empty or already gone — ignore
  }

  console.log(`promptocop skill removed from ${path}`);
}
