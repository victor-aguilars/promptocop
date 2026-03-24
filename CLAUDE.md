# promptcop

A prompt linter for Claude Code. Catches bad prompt patterns before they reach the model — like ESLint, but for the things you type at Claude.

---

## Project overview

`promptcop` is a Node.js CLI tool that analyzes prompts for anti-patterns known to cause correction loops, token waste, and task drift. It ships with a rule engine modeled after ESLint: rules have severity levels (error/warn/info), are individually configurable via a `.promptcop.yml` config file, and can be organized into shareable presets.

There are two integration modes:
1. **Standalone CLI** — `promptcop lint "your prompt"` run manually before sending
2. **Claude Code hook** — wired into Claude Code's `PreToolUse` lifecycle hook so it runs automatically before every message

---

## Tech stack

- **Runtime:** Node.js (>=18)
- **Language:** TypeScript
- **CLI framework:** `commander`
- **Config parsing:** `js-yaml`
- **Output formatting:** `chalk` + `ora`
- **Testing:** `vitest`
- **Distribution:** npm package, executable via `npx promptcop`

---

## Project structure

```
promptcop/
├── src/
│   ├── cli.ts              # Entry point, commander setup
│   ├── linter.ts           # Core lint runner — loads rules, runs them, collects results
│   ├── config.ts           # .promptcop.yml loader and resolver
│   ├── formatter.ts        # Output formatting (default, json, compact)
│   ├── fixer.ts            # --fix mode: applies auto-fixes to prompt
│   ├── rules/
│   │   ├── index.ts        # Rule registry
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
│   └── hook/
│       └── install.ts      # Claude Code hook installer
├── .promptcop.yml          # Example config (used for dogfooding)
├── CLAUDE.md               # This file
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Rule system

### Rule interface

Every rule implements this interface:

```ts
interface Rule {
  name: string;
  description: string;
  severity: 'error' | 'warn' | 'info';  // default, overridable via config
  check(prompt: string): RuleResult;
  fix?(prompt: string): string;          // optional auto-fix
  explain(): string;                     // shown by `promptcop explain <rule>`
}

interface RuleResult {
  passed: boolean;
  message?: string;   // human-readable explanation of the violation
  line?: number;      // if prompt is multiline, which line triggered it
}
```

### Severity levels

| Level | Meaning |
|-------|---------|
| `error` | Likely to cause correction loops or task failure. Blocks by default. |
| `warn` | Likely to waste tokens or cause drift. Shown but doesn't block. |
| `info` | Style or efficiency suggestion. |
| `off` | Rule disabled. |

### Rules to implement (v1)

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
promptcop lint "refactor the auth module"

# Lint from stdin (useful for piping)
echo "fix the bug" | promptcop lint -

# Auto-fix mode — rewrites prompt with placeholders
promptcop lint "refactor the auth module" --fix

# Output as JSON (for tooling integration)
promptcop lint "refactor the auth module" --format json

# Explain a specific rule
promptcop explain no-vague-verb

# List all available rules
promptcop rules

# Install the Claude Code hook
promptcop hook install

# Uninstall the Claude Code hook
promptcop hook uninstall

# Initialize a .promptcop.yml in current directory
promptcop init
```

---

## Output format (default)

```
promptcop v0.1.0

✖ error    no-vague-verb          "refactor" needs a target, pattern, or goal
⚠ warning  no-file-context        No file or code reference found — add a file path or identifier to narrow scope
⚠ warning  no-constraints         No constraints specified — consider adding limits, requirements, or restrictions
✓ pass     no-ambiguous-pronoun
✓ pass     missing-success-criteria

2 errors, 2 warnings — run with --fix to attempt auto-fix
```

---

## Config file (.promptcop.yml)

Resolved from current directory upward (same as ESLint).

```yaml
extends:
  - promptcop:recommended

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
```

If no config is found, `promptcop:recommended` is used as the default.

---

## Claude Code hook integration

Claude Code supports lifecycle hooks defined in `~/.claude/settings.json` under the `hooks` key. The `UserPromptSubmit` hook fires when the user submits a message, receiving the prompt on stdin and blocking if the process exits with a non-zero code.

### What `promptcop hook install` does

1. Reads `~/.claude/settings.json` (creates it if missing)
2. Appends a `UserPromptSubmit` hook entry pointing to the `promptcop` binary
3. Sets hook to block on errors, warn on warnings

### Hook behavior

- **Errors found** → exits 1, Claude Code blocks the send and surfaces the output
- **Warnings only** → exits 0 with output (non-blocking), Claude Code shows it
- **All pass** → exits 0 silently

### Hook config shape (written into settings.json)

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "promptcop lint --format compact --hook -"
          }
        ]
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
promptcop lint "refactor the auth module" --ai
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
- [x] First rule: `no-vague-verb`
- [x] CLI entry point with `lint` command
- [x] Default formatter
- [x] Remaining v1 rules
- [x] `--fix` mode
- [x] `explain` command
- [x] Hook installer
- [x] `promptcop:recommended` preset
- [ ] README
- [ ] npm publish setup