---
name: human-review-handoff
description: Produce a compact review packet for a human before ship: scope, files changed, proof, risks, and exact review focus areas.
---

# Human Review Handoff Skill

Use this before shipping medium or complex work.

The point is to make human review fast, focused, and useful.

---

## Build The Review Packet

Include:
- task summary in 1 to 2 sentences
- files changed
- proof gathered: tests, curl responses, screenshots, logs
- remaining risks
- exact review focus areas

---

## Review Focus Template

```markdown
## Human Review Handoff

**Task**: [what changed]
**Why**: [why this work was needed]

**Files changed**:
- path/to/file

**Verified**:
- [test or proof]

**Please review especially**:
- [high-risk area 1]
- [high-risk area 2]

**Open risks**:
- [risk or "none"]
```

---

## When To Require This

- auth changes
- migrations
- deployment changes
- anything spanning backend + frontend
- any feature where rollback would be painful

---

> Rule: Human review should inspect the risky edge, not reconstruct the whole task from git diff archaeology.
