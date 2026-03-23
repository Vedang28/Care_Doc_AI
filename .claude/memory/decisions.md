# Decisions — Architecture Record

> Key decisions with reasoning. Append-only — never delete.
> Added by /session-end when significant architectural decisions are made.
> Cross-reference with ADR.md for formal records.

---

## Format

```markdown
### [YYYY-MM-DD] — [Decision Title]
**Decision**: [What was decided]
**Why**: [Reasoning — what made this the right choice]
**Alternatives rejected**: [What else was considered and why it lost]
**Impact**: [What parts of the codebase this affects]
**Revisit if**: [Conditions under which this decision should be reconsidered]
```

---

### 2026-03-22 — Added project-scan and task-orchestrator JavaScript helpers
**Decision**: Added project-scan and task-orchestrator JavaScript helpers
**Why**: Captured automatically from the latest structured session save.
**Alternatives rejected**: Not recorded yet.
**Impact**: Review the current task, related memory files, and touched code before changing this area.
**Revisit if**: The workflow or project requirements change materially.

### 2026-03-22 — Structured session saves now sync PRIORITY-WORK and append decisions automatically
**Decision**: Structured session saves now sync PRIORITY-WORK and append decisions automatically
**Why**: Captured automatically from the latest structured session save.
**Alternatives rejected**: Not recorded yet.
**Impact**: Review the current task, related memory files, and touched code before changing this area.
**Revisit if**: The workflow or project requirements change materially.

<!-- New decisions go here, newest first -->

---

> Every significant "why did we do it this way?" should live here.
> Future sessions — and future you — will thank present you.
