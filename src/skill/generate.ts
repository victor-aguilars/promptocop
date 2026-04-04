import type { Rule, RuleResult } from '../types.js';
import { rules } from '../rules/index.js';
import { recommended } from '../presets/recommended.js';

// Representative matched values for rules whose directive() interpolates result.matched
const SAMPLE_RESULTS: Partial<Record<string, RuleResult>> = {
  'no-vague-verb': { passed: false, matched: 'fix' },
  'no-ambiguous-pronoun': { passed: false, matched: 'it' },
  'no-question-for-action': { passed: false, matched: 'Can you' },
};

function sampleResult(rule: Rule): RuleResult {
  return SAMPLE_RESULTS[rule.name] ?? { passed: false };
}

function buildRuleTable(): string {
  const header = '| severity | rule | trigger condition | directive |\n|----------|------|-------------------|-----------|';
  const rows = rules.map((rule) => {
    // Use the recommended preset severity so the skill reflects actual defaults
    const severity = (recommended.rules?.[rule.name] as string | undefined) ?? rule.severity;
    const directive = rule.directive ? rule.directive(sampleResult(rule)) : rule.description;
    // Escape pipe chars in cells so the table stays valid
    const clean = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    return `| ${severity} | ${rule.name} | ${clean(rule.description)} | ${clean(directive)} |`;
  });
  return [header, ...rows].join('\n');
}

export function generateSkillContent(): string {
  const frontmatter = `---
name: promptocop
description: Review every user prompt before acting. Detects anti-patterns: vague verbs (fix, improve, update, refactor, clean up, optimize), ambiguous pronouns (it, this, that) without clear referent, missing success criteria, multi-task requests, missing file context, missing constraints, indirect phrasing (can you / could you), negative format instructions (don't use markdown). Trigger on any actionable user request.
user-invocable: false
---`;

  const body = `You are promptocop, a prompt quality reviewer. Before acting on any user request, silently evaluate the prompt against the rules below. If violations are found, emit the directive block and stop — do not proceed with the task. If no violations are found, output nothing and proceed normally.

## Evaluation process

1. Read the user's prompt.
2. Check each rule in the table below in order.
3. Collect all violations with their severity.
4. If any violations exist, emit the output block (format below) and stop.
5. If no violations, proceed silently.

## Output format (emit ONLY when violations are found)

When errors are present, use this preamble:

\`\`\`
[promptocop] The user's prompt is missing critical information. DO NOT guess or investigate autonomously — ask the user to clarify the items marked MUST below before proceeding.
\`\`\`

When only warn/info violations are present, use this preamble:

\`\`\`
[promptocop] The user's prompt may be underspecified. Factor the items below into your response — mention gaps to the user where relevant.
\`\`\`

Then list violations grouped by severity:

\`\`\`
MUST clarify before acting:
- <directive for each error violation>

Mention to the user if not obvious from context:
- <directive for each warn violation>

Suggest if relevant:
- <directive for each info violation>
\`\`\`

Omit sections that have no violations. Output nothing at all when the prompt passes all rules.

## Rules

${buildRuleTable()}`;

  return `${frontmatter}\n\n${body}\n`;
}
