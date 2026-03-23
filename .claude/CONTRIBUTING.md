# Contributing to claude-forge

Thanks for wanting to improve claude-forge. Contributions are straightforward — here's exactly what's needed and how.

---

## What we need most

Ranked by impact:

1. **New stack templates** — `templates/stacks/[stack].md` for stacks not yet covered (Django, Laravel, Rust/Axum, Elixir/Phoenix, etc.)
2. **New feature scaffolds** — `templates/features/[feature].md` for common patterns (OAuth, webhooks, cron jobs, etc.)
3. **New agents** — `agents/[name].md` for specialist roles not yet covered
4. **Improvements to existing commands** — make them more robust, handle more edge cases
5. **Bug reports** — something doesn't work as described? Open an issue.
6. **Real-world examples** — used claude-forge on a project? Share a filled `CLAUDE.md` in `examples/`

---

## How to contribute

### 1. Open an issue first (for new features)

Before writing a new template or agent, open an issue to describe what you're adding. Prevents duplicate work.

For bug fixes, you can skip straight to a PR.

### 2. Fork and clone

```bash
git clone https://github.com/YOUR_USERNAME/claude-forge.git
cd claude-forge
```

### 3. Create your contribution

Follow the file formats below. The existing files are the best reference.

### 4. Test it

Actually use what you built with Claude Code on a real project. If it doesn't produce better output than not having it, revise it.

### 5. Submit a PR

Keep the PR focused — one template, one agent, one fix. Include a short description of what it does and how you tested it.

---

## File formats

### Stack template (`templates/stacks/[stack].md`)

```markdown
---
name: [stack-name]
description: [one-line description of the stack]
---

# Stack Template: [Name]

## CLAUDE.md Tech Stack Section
[markdown table: layer → technology]

## Folder Structure
[directory tree]

## Required Environment Variables
[env block with comments]

## Initial Setup Commands
[bash block]

## App Entry Pattern
[key file with code example]

## Key Patterns
[bullet list of patterns specific to this stack]
```

### Agent (`agents/[name].md`)

```markdown
---
name: [agent-name]
description: [one sentence — what this agent does and when to invoke it]
---

# [Name] Agent

You are the [role] agent. Your ONLY job is [one sentence].

## Your Process
[numbered steps]

## Output Format
[what the agent returns]

## Rules
[bullet list — constraints on what the agent should/shouldn't do]
```

### Command (`commands/[name].md`)

```markdown
---
name: [command-name]
description: [one sentence — what it does, when to run it]
---

# /[command] — [Short Title]

## Step 1: [First step]
[content]

## Step 2: [Second step]
[content]

> Rule: [key rule for this command]
```

---

## What makes a good contribution

- **Specific over generic.** A template that works perfectly for one stack is better than one that half-works for five.
- **Tested.** You've actually used it. The output was noticeably better.
- **Consistent format.** Match the style of existing files — frontmatter, headings, code blocks.
- **One thing.** A PR that adds a Django template is good. A PR that adds Django + redesigns CLAUDE.md is too large.

---

## Issues

Use GitHub issues for:
- Bug reports (command produces wrong output, install.sh fails, etc.)
- Feature requests (new stack, new agent, new command)
- Questions about how something works

---

## License

By contributing, you agree your contributions are licensed under MIT — the same as the rest of claude-forge.
