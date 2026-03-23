# Session Handoff

## Resume Brief
- Current State: Preparing commit and push to GitHub
- Next Action: Review git diff, commit the claude-forge upgrade, and push main
- Context Pressure: 61% used / 39% left
- Recommended Action: continue

### Open First
- memory/current-context.json
- PRIORITY-WORK.md
- scripts/session-memory.js
- scripts/task-orchestrator.js
- scripts/project-scan.js

### Suggested Files
- scripts/session-memory.js
- scripts/task-orchestrator.js
- scripts/project-scan.js
- README.md

### Avoid Reading
- Read memory/current-context.json first.
- Do not scan the full repo unless the brief is missing something critical.
- Do not open memory/decisions.md, memory/patterns.md, or memory/errors.md unless the current task needs them.

### Reuse Commands
- node scripts/task-orchestrator.js --task "upgrade claude-forge" --needs-backend --needs-testing --context-usage 61
- node scripts/session-guard.js --context-usage 96 --auto-close --summary "..." --in-progress "..." --next "..."

### Context Policy
- Warn at 70% used
- Save at 85% used
- Stop at 95% used
- If usage reaches the stop threshold, save and resume in a fresh session.

## Session
- Label: focus-session
- Saved At: 2026-03-21T22:00:48.442Z
- Reason: manual-save

## Completed
- Upgraded memory system and added orchestration tooling

## In Progress
- Preparing commit and push to GitHub

## Next Steps
1. Review git diff, commit the claude-forge upgrade, and push main

## Must Remember
- PRIORITY-WORK now syncs automatically from session saves
- decisions.md auto-appends fresh decisions from structured saves
- orchestrate + project-scan are now first-class workflow tools

## Blockers
- none

## Recent Decisions
- Added project-scan and task-orchestrator JavaScript helpers
- Structured session saves now sync PRIORITY-WORK and append decisions automatically

## Open Questions
- none
