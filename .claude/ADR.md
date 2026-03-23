# Architecture Decision Records (ADR)

> Document every significant architectural decision here.
> WHY decisions were made is more valuable than WHAT was decided.
> Future Claude sessions and human developers will thank you.

---

## Format

```markdown
## ADR-[N] — [Date] — [Decision Title]
**Status**: Accepted / Superseded by ADR-X / Deprecated
**Context**: Why was a decision needed? What problem were we solving?
**Decision**: What was decided?
**Alternatives considered**: What else was evaluated and why rejected?
**Consequences**: What trade-offs does this decision accept?
**Rollback**: How to undo this decision if needed?
```

---

## ADR-001 — [Date] — [FILL: First decision]

**Status**: Accepted

**Context**: [FILL]

**Decision**: [FILL]

**Alternatives considered**: [FILL]

**Consequences**: [FILL]

**Rollback**: 
```bash
# Commands to undo this decision
```

---

## Rollback Reference

> Keep the last 3 production-stable commit hashes here.
> Update every time /ship succeeds.

| Date | Commit Hash | Description | Rollback Command |
|------|-------------|-------------|-----------------|
| [DATE] | [HASH] | [what was working] | `git reset --hard [HASH]` |
| [DATE] | [HASH] | [what was working] | `git reset --hard [HASH]` |
| [DATE] | [HASH] | [what was working] | `git reset --hard [HASH]` |

### Emergency Rollback Procedure
```bash
# 1. Note the bad commit
BAD_COMMIT=$(git rev-parse HEAD)
echo "Rolling back from: $BAD_COMMIT"

# 2. Reset to last known good
git reset --hard [LAST_GOOD_HASH]

# 3. Force push (only on emergency)
git push origin main --force-with-lease

# 4. Deploy rollback to VPS
ssh $VPS_USER@$VPS_IP << ENDSSH
  cd $VPS_APP_PATH
  git fetch origin main
  git reset --hard [LAST_GOOD_HASH]
  npm install --production
  npx prisma migrate deploy
  pm2 restart $PM2_PROCESS
  echo "✅ Rolled back to [LAST_GOOD_HASH]"
ENDSSH

# 5. Verify
curl -s http://$VPS_IP:$APP_PORT/api/v1/health

# 6. Write a post-mortem in lessons.md immediately
```
