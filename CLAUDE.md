# promptocop

A prompt linter for Claude Code and Cursor. Analyzes your prompts for anti-patterns and surfaces issues as context for the model — like ESLint, but for the prompts you type in your AI editor.

---

## Project overview

`promptocop` is a Node.js CLI tool that analyzes prompts for anti-patterns known to cause correction loops, token waste, and task drift. It ships with a rule engine modeled after ESLint: rules have severity levels (error/warn/info), are individually configurable via a `.promptocop.yml` config file, and can be organized into shareable presets.

There are three integration modes:
1. **Standalone CLI** — `promptocop lint "your prompt"` run manually before sending
2. **Agent Skill** (Claude Code & Cursor) — a `SKILL.md` installed into the editor's skills directory that the editor loads automatically and uses to review prompts via AI reasoning
3. **Editor Hook** (Claude Code & Cursor) — wired into the editor's prompt submit lifecycle hook so it runs automatically before every message using static regex rules

---

## Tech stack

- **Runtime:** Node.js (>=18)
- **Language:** TypeScript
- **CLI framework:** `commander`
- **Config parsing:** `js-yaml`
- **Output formatting:** `chalk` + `ora`
- **Testing:** `vitest`
- **Distribution:** npm package, executable via `npx promptocop`

---

## Project structure

```
promptocop/
├── src/
│   ├── cli.ts              # Entry point, commander setup
│   ├── linter.ts           # Core lint runner — loads rules, runs them, collects results
│   ├── config.ts           # .promptocop.yml loader and resolver
│   ├── formatter.ts        # Output formatting (default, json, compact, directive)
│   ├── fixer.ts            # --fix mode: applies auto-fixes to prompt
│   ├── types.ts            # Shared TypeScript interfaces (Rule, RuleResult, LintResult, etc.)
│   ├── __tests__/          # Integration tests (cli-hook, config, formatter)
│   ├── rules/
│   │   ├── index.ts        # Rule registry + getRuleByName helper
│   │   ├── __tests__/      # Per-rule unit tests
│   │   ├── no-vague-verb.ts
│   │   ├── no-ambiguous-pronoun.ts
│   │   ├── no-file-context.ts
│   │   ├── no-constraints.ts
│   │   ├── multi-task.ts
│   │   ├── missing-success-criteria.ts
│   │   ├── context-dump-risk.ts
│   │   └── prefer-example.ts
│   ├── presets/
│   │   └── recommended.ts  # Default ruleset and severities
│   ├── skill/
│   │   ├── generate.ts     # Generates SKILL.md content from the rule registry
│   │   └── install.ts      # Claude Code skill installer / uninstaller
│   └── hook/
│       ├── install.ts      # Target-agnostic hook installer / uninstaller
│       ├── targets.ts      # Editor-specific hook targets (Claude Code, Cursor)
│       └── __tests__/      # Hook unit + integration tests
├── CLAUDE.md               # This file
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Rule system

### Rule interface

All shared types live in `src/types.ts`. Every rule implements:

```ts
interface Rule {
  name: string;
  description: string;
  severity: 'error' | 'warn' | 'info';  // default, overridable via config
  check(prompt: string, options?: Record<string, unknown>): RuleResult;
  fix?(prompt: string, options?: Record<string, unknown>): string;  // optional auto-fix
  explain(): string;                     // shown by `promptocop explain <rule>`
  directive?(result: RuleResult): string; // actionable instruction injected as Claude context
}

interface RuleResult {
  passed: boolean;
  message?: string;   // human-readable explanation of the violation
  line?: number;      // if prompt is multiline, which line triggered it
  matched?: string;   // the specific text that triggered the rule (e.g. the vague verb)
}
```

`directive()` is called when a rule fails in hook mode. Its return value is surfaced to Claude as a precise, actionable instruction (e.g. "Ask the user what specifically should be refactored and why"). Rules without `directive()` fall back to `"ruleName: message"`.

### Severity levels

| Level | Meaning |
|-------|---------|
| `error` | Likely to cause correction loops or task failure. Blocks by default. |
| `warn` | Likely to waste tokens or cause drift. Shown but doesn't block. |
| `info` | Style or efficiency suggestion. |
| `off` | Rule disabled. |

### Implemented rules (v1)

| Rule | Severity | Auto-fix |
|------|----------|----------|
| `no-vague-verb` | error | Yes — prompts for specific replacement |
| `no-ambiguous-pronoun` | error | No |
| `missing-success-criteria` | error | No |
| `no-file-context` | warn | No |
| `no-constraints` | warn | No |
| `multi-task` | error | Yes — splits into numbered sub-tasks |
| `context-dump-risk` | warn | No |
| `prefer-example` | info | No |

### Vague verbs list (seed list, extend over time)

`fix`, `improve`, `make better`, `clean up`, `update`, `change`, `refactor`, `optimize`, `enhance`, `adjust`, `tweak`, `look at`, `handle`, `deal with`

A vague verb violation is triggered when one of these appears without a qualifying target, pattern, or goal immediately following.

### Ambiguous pronouns

Triggered when `it`, `this`, `that`, `these`, `those` appear as the direct object of an action verb with no clear referent in the same sentence.

---

## CLI commands

```bash
# Lint a prompt string
promptocop lint "refactor the auth module"

# Lint from stdin (useful for piping)
echo "fix the bug" | promptocop lint -

# Auto-fix mode — rewrites prompt with placeholders
promptocop lint "refactor the auth module" --fix

# Output as JSON (for tooling integration)
promptocop lint "refactor the auth module" --format json

# Explain a specific rule
promptocop explain no-vague-verb

# List all available rules
promptocop rules

# Install as an Agent Skill (Claude Code, default)
promptocop skill install

# Install for Cursor
promptocop skill install --target cursor

# Install at project scope
promptocop skill install --project
promptocop skill install --target cursor --project

# Uninstall the skill
promptocop skill uninstall
promptocop skill uninstall --target cursor

# Install the hook (Claude Code, default)
promptocop hook install

# Install the hook for Cursor
promptocop hook install --target cursor

# Uninstall the hook (Claude Code)
promptocop hook uninstall

# Uninstall the hook (Cursor)
promptocop hook uninstall --target cursor

# Initialize a .promptocop.yml in current directory
promptocop init
```

---

## Output formats

### Default (terminal use)

```
promptocop v0.1.0

✖ error    no-vague-verb          "refactor" needs a target, pattern, or goal
⚠ warning  no-file-context        No file or code reference found — add a file path or identifier to narrow scope
⚠ warning  no-constraints         No constraints specified — consider adding limits, requirements, or restrictions
✓ pass     no-ambiguous-pronoun
✓ pass     missing-success-criteria

2 errors, 2 warnings — run with --fix to attempt auto-fix
```

### Directive (hook mode default)

Used when `--hook` is passed. Written to stdout so the editor injects it as context before responding.

```
[promptocop] The user's prompt is missing critical information. DO NOT guess or investigate autonomously — ask the user to clarify the items marked MUST below before proceeding.

MUST clarify before acting:
- Ask the user what specifically should be refactored and what the goal is (e.g. readability, performance, structure)

Mention to the user if not obvious from context:
- No file or code reference found — ask which file or component to focus on
```

### Compact (hook fallback, `--format compact`)

One violation per line — `severity: rule: message`. Selected in hook mode when `context.mode: compact` is set in config.

### JSON (`--format json`)

Pretty-printed array of `LintResult` objects.

---

## Config file (.promptocop.yml)

Resolved from current directory upward (same as ESLint).

```yaml
# Set to false to disable promptocop without removing the hook
enabled: true

extends:
  - promptocop:recommended

rules:
  no-vague-verb: error
  no-file-context: warn
  multi-task: error
  prefer-example: info
  missing-success-criteria: off

# Optional: per-project vague verb additions
options:
  no-vague-verb:
    additionalVerbs:
      - "touch"
      - "revisit"

# Hook context output format: "directive" (default) or "compact"
# context:
#   mode: directive
```

If no config is found, `promptocop:recommended` is used as the default.

### Config fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | `true` | Set to `false` to silently disable without removing the hook |
| `extends` | string[] | `['promptocop:recommended']` | Preset(s) to extend |
| `rules` | Record | — | Per-rule severity overrides |
| `options` | Record | — | Per-rule configuration options |
| `context.mode` | `'directive'` \| `'compact'` | `'directive'` | Hook output format |

---

## Skill integration

Claude Code and Cursor supports [Agent Skills](https://agentskills.io) — directories containing a `SKILL.md` file that agents load automatically when relevant. Skills follow the open agentskills.io standard and work across multiple AI tools.

### What `promptocop skill install` does

1. Generates a `SKILL.md` by iterating the rule registry (`src/skill/generate.ts`)
2. Writes it to the target editor's skills directory:
   - Claude Code personal: `~/.claude/skills/promptocop/SKILL.md`
   - Claude Code project: `.claude/skills/promptocop/SKILL.md`
   - Cursor personal: `~/.cursor/skills/promptocop/SKILL.md`
   - Cursor project: `.cursor/skills/promptocop/SKILL.md`

### Skill behavior

The generated `SKILL.md` has `user-invocable: false` — it is hidden from the slash menu and triggered automatically by Claude based on its description. The body contains a compact one-row-per-rule table (trigger condition + directive) built from `rule.directive()` output. No verbose rationale is included, keeping the skill token-efficient.

Claude evaluates the prompt against all rules, then either:
- Emits the directive output block and stops (violations found)
- Proceeds silently (no violations)

The directive column values in the table are generated by calling `rule.directive(sampleResult)` at install time, so they stay in sync as rules evolve.

### Skill vs. hook

| | Skill | Hook |
|---|---|---|
| Execution | Claude AI reasoning | Shell command (`npx`) |
| Rule evaluation | Semantic / fuzzy | Regex / exact |
| Token cost | ~60 lines in context | Zero |
| Requires `npx` | No | Yes |
| Configurable via `.promptocop.yml` | No | Yes |

Both can coexist. The skill is the simpler default; the hook is useful for deterministic, config-driven linting.

---

## Hook integration

promptocop integrates with editor hooks via `promptocop hook install --target <editor>`. The `--target` flag selects the editor (`claude` or `cursor`, default `claude`).

### Supported editors

| Editor | Config file | Hook event | Install command |
|--------|------------|------------|-----------------|
| Claude Code | `~/.claude/settings.json` | `UserPromptSubmit` | `promptocop hook install` |
| Cursor | `~/.cursor/hooks.json` | `beforeSubmitPrompt` | `promptocop hook install --target cursor` |

### What `promptocop hook install` does

1. Reads the editor's config file (creates it if missing)
2. Appends a hook entry pointing to the `promptocop` binary
3. Detection is idempotent — re-running install when already present is a no-op

### Hook behavior

The hook fires *after* the user presses Enter. It is **always non-blocking** — it never prevents a prompt from being sent. Instead it injects lint feedback as context that the model sees before it starts responding.

**Behavior:**
- Violations found → writes formatted violations to stdout, exits 0. The editor injects this as context.
- All pass (or `enabled: false`) → exits 0 silently, nothing injected.

The output format is controlled by `context.mode` in `.promptocop.yml`:
- `directive` (default) — LLM-targeted instructions with severity-specific preambles, uses `rule.directive()` output
- `compact` — one violation per line (`severity: rule: message`)

### Hook config shapes

**Claude Code** (written into `~/.claude/settings.json`):

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx promptocop lint --hook -"
          }
        ]
      }
    ]
  }
}
```

**Cursor** (written into `~/.cursor/hooks.json`):

```json
{
  "version": 1,
  "hooks": {
    "beforeSubmitPrompt": [
      {
        "command": "npx promptocop lint --hook -",
        "type": "command"
      }
    ]
  }
}
```

---

## Future: LLM-powered rules

The v1 rule engine is entirely static (regex + heuristics). This is intentional — fast, offline, zero token cost.

A future `--ai` flag will pipe the prompt to Claude for deeper analysis that static rules can't catch:

```bash
promptocop lint "refactor the auth module" --ai
```

### Planned LLM-powered rules

| Rule | Why it needs LLM |
|------|-----------------|
| `semantic-vagueness` | Detects prompts that are syntactically specific but semantically underspecified |
| `implicit-assumption` | Flags when the prompt assumes context Claude doesn't have |
| `scope-creep-risk` | Predicts whether the task as written will cause Claude to over-reach |
| `rewrite` | Full prompt rewrite with explanation of every change made |

### Implementation notes (for future reference)

- Use `claude-sonnet-4-6` via the Anthropic SDK
- Keep LLM calls optional and clearly separated from static rules
- Cache results keyed by prompt hash to avoid redundant API calls
- Surface LLM rule results with an `[ai]` tag in output to distinguish from static rules
- Consider a `--explain-ai` flag that asks the model to explain its reasoning per rule

---

## Development conventions

- All rules live in `src/rules/` as individual files, one rule per file
- Rule names use kebab-case and match their filename exactly
- Every rule must have a test file in `src/rules/__tests__/`
- Tests cover: basic violation, no violation, edge cases, fix output (if applicable)
- Keep the linter core (`linter.ts`) dependency-free — no CLI or formatting concerns
- Formatter and CLI are separate concerns from the rule engine

---

## Current status

- [x] Project scaffold (package.json, tsconfig, vitest config)
- [x] Core rule interface and linter runner
- [x] Config loader
- [x] All v1 rules (8 rules)
- [x] CLI entry point with all commands (`lint`, `explain`, `rules`, `init`, `hook`, `skill`)
- [x] Default + compact + JSON + directive formatters
- [x] `--fix` mode
- [x] Hook installer / uninstaller (Claude Code + Cursor)
- [x] Skill installer / uninstaller (`src/skill/`)
- [x] `promptocop:recommended` preset
- [x] `directive()` method on rules — LLM-targeted context injection in hook mode
- [x] README
- [ ] npm publish setup