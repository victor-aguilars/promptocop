import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import yaml from 'js-yaml';
import type { PromptcopConfig, Severity } from './types.js';
import { recommended } from './presets/recommended.js';

function deepMergeConfigs(base: PromptcopConfig, override: PromptcopConfig): PromptcopConfig {
  return {
    rules: { ...base.rules, ...override.rules } as Record<string, Severity>,
    options: {
      ...base.options,
      ...Object.fromEntries(
        Object.entries(override.options ?? {}).map(([key, val]) => [
          key,
          { ...(base.options?.[key] ?? {}), ...val },
        ]),
      ),
    },
  };
}

function resolveExtends(config: PromptcopConfig): PromptcopConfig {
  if (!config.extends || config.extends.length === 0) {
    return config;
  }

  let base: PromptcopConfig = {};
  for (const preset of config.extends) {
    if (preset === 'promptcop:recommended') {
      base = deepMergeConfigs(base, recommended);
    }
    // Future: support external preset packages
  }

  const { extends: _ext, ...rest } = config;
  return deepMergeConfigs(base, rest);
}

export function loadConfig(startDir?: string): PromptcopConfig {
  const dir = startDir ?? process.cwd();
  const configPath = findConfigFile(dir);

  if (!configPath) {
    return recommended;
  }

  try {
    const raw = readFileSync(configPath, 'utf8');
    const parsed = yaml.load(raw) as PromptcopConfig;
    if (!parsed || typeof parsed !== 'object') {
      return recommended;
    }
    return resolveExtends(parsed);
  } catch {
    return recommended;
  }
}

function findConfigFile(startDir: string): string | null {
  let current = resolve(startDir);

  while (true) {
    const candidates = [
      resolve(current, '.promptcop.yml'),
      resolve(current, '.promptcop.yaml'),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }
    const parent = dirname(current);
    if (parent === current) break; // filesystem root
    current = parent;
  }

  return null;
}
