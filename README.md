<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
    <img src="assets/logo.svg" alt="promptocop" height="120" />
  </picture>
</div>

A prompt linter for Claude Code and Cursor. Analyzes your prompts for anti-patterns and surfaces issues as context for the model — like ESLint, but for the things you type.

---

## Setup

There are two integration modes. Pick one — or use both.

### Option 1: Agent Skill (recommended)

Installs a `SKILL.md` that Claude Code and Cursor load automatically. The editor applies the rules using its own reasoning — no shell execution, no `npx` on every prompt:

```bash
# Claude Code (default)
npx promptocop skill install

# Cursor
npx promptocop skill install --target cursor
```

This writes a `SKILL.md` to your editor's skills directory. Your editor picks it up immediately. To install at project scope instead:

```bash
npx promptocop skill install --project
npx promptocop skill install --target cursor --project
```

To remove:

```bash
npx promptocop skill uninstall
npx promptocop skill uninstall --target cursor
```

**Other editors:** If your editor supports agent skills but isn't listed above, print the `SKILL.md` to stdout and place it wherever your editor expects:

```bash
npx promptocop skill generate > /path/to/your/editor/skills/promptocop/SKILL.md
```

### Option 2: Hook (shell-based)

Adds an editor hook that runs `npx promptocop lint --hook -` before every prompt. Regex-based, fast, zero Claude tokens:

```bash
# Claude Code (default)
npx promptocop hook install

# Cursor
npx promptocop hook install --target cursor
```

For Claude Code this adds a `UserPromptSubmit` hook to `~/.claude/settings.json`. For Cursor it adds a `beforeSubmitPrompt` hook to `~/.cursor/hooks.json`. When a prompt has issues, the lint results are injected as context so the model can factor them into its response — nothing is blocked by default.

To remove:

```bash
npx promptocop hook uninstall
npx promptocop hook uninstall --target cursor
```

> Both can coexist, but running both on every prompt is redundant. The skill is the simpler default; use the hook if you want deterministic regex-based linting independent of Claude's reasoning.

### How it works

Violations are surfaced as advisory metadata alongside your prompt. Claude sees the findings and decides what to act on based on conversation context:

```
[promptocop] The user's prompt is missing critical information. DO NOT guess
or investigate autonomously — ask the user to clarify the items marked MUST
below before proceeding.

MUST clarify before acting:
- Ask the user what specifically they want to "fix" — what file, function, or
  component, and what the end state should look like.

Mention to the user if not obvious from context:
- No file or code reference found — ask which file or component to focus on.
```

| Severity | Behavior |
|---|---|
| `error` | Claude stops and asks for clarification before proceeding |
| `warn` | Claude mentions gaps if relevant to the response |
| `info` | Claude suggests improvements the user could consider |

---

## Standalone CLI

You can also run promptocop directly without the hook:

```bash
npx promptocop lint "refactor the auth module"
```

**Example output:**

```
promptocop v0.2.0

✖ error   no-vague-verb                "refactor" needs a target, pattern, or goal
⚠ warning no-constraints               No constraints specified — consider adding limits, requirements, or restrictions
✓ pass   no-ambiguous-pronoun
✓ pass   missing-success-criteria
✓ pass   multi-task
✓ pass   no-file-context
✓ pass   context-dump-risk
✓ pass   prefer-example

1 error, 1 warning — run with --fix to attempt auto-fix
```

```bash
# Lint from stdin
echo "fix the bug" | promptocop lint -

# Auto-fix — rewrites the prompt with placeholders where vague
promptocop lint "refactor the auth module" --fix

# JSON output (for scripting/tooling)
promptocop lint "your prompt" --format json

# List all rules with severities
promptocop rules

# Explain a rule
promptocop explain no-vague-verb
```

---

## Rules

| Rule | Severity | Auto-fix | What it catches |
|------|----------|----------|-----------------|
| `no-vague-verb` | error | yes | Vague verbs like "fix", "refactor", "improve" without a target or goal |
| `no-ambiguous-pronoun` | error | no | "it", "this", "that" as verb objects with no clear referent |
| `missing-success-criteria` | error | no | No definition of done — "so that", "should return", "verify that", etc. |
| `multi-task` | error | yes | Multiple independent tasks crammed into one prompt |
| `no-file-context` | warn | no | No file path, module, or code reference to narrow scope |
| `no-constraints` | warn | no | No constraints, limits, or requirements |
| `context-dump-risk` | warn | no | Pasted logs, large code blocks, or excessively long prompts |
| `prefer-example` | info | no | Long prompts with no example to illustrate the goal |

Run `promptocop explain <rule>` for details on any rule.

---

## Configuration

Create a `.promptocop.yml` (or run `promptocop init`):

```yaml
extends:
  - promptocop:recommended

rules:
  no-vague-verb: error
  missing-success-criteria: off   # disable a rule
  prefer-example: warn            # change severity

options:
  no-vague-verb:
    additionalVerbs:
      - "touch"
      - "revisit"
```

Config is resolved upward from the current directory, the same way ESLint does it. If no config is found, `promptocop:recommended` is used.

To switch hook output to compact violation labels instead of advisory directives:

```yaml
context:
  mode: compact
```

---

## Development

```bash
git clone <repo>
cd promptocop
npm install
npm test          # run all tests (vitest)
npm run build     # compile TypeScript to dist/
npm run dev -- lint "your prompt"   # run from source with tsx
```

Rules live in `src/rules/`, one file per rule. Each rule implements the `Rule` interface from `src/types.ts` and has a corresponding test in `src/rules/__tests__/`.
