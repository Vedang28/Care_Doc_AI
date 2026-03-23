---
name: bug-hunter
description: Deep bug investigation skill. Use when /fix needs more depth — traces errors through the full stack, reads all logs, identifies root cause systematically.
---

# Bug Hunter Skill — Deep Investigation

Use this when a bug is not obvious from the error message alone.

## Phase 1: Evidence Collection

### Application Logs
```bash
# PM2 (production)
ssh $VPS_USER@$VPS_IP "pm2 logs $PM2_PROCESS --lines 200 --nostream" 2>&1

# Local
cat logs/error.log | tail -100
cat logs/combined.log | grep "ERROR\|FATAL\|Unhandled" | tail -50
```

### Recent Changes
```bash
# What changed in the last 5 commits?
git log --oneline -5
git show HEAD --stat
git diff HEAD~1 HEAD -- src/ 2>&1 | head -100
```

### System State
```bash
# Is the process even running?
ssh $VPS_USER@$VPS_IP "pm2 list && ps aux | grep node | grep -v grep"

# Memory / CPU
ssh $VPS_USER@$VPS_IP "free -h && top -bn1 | head -15"

# DB connection
ssh $VPS_USER@$VPS_IP "cd $VPS_APP_PATH && npx prisma db execute --stdin <<< 'SELECT 1'"

# Redis
ssh $VPS_USER@$VPS_IP "redis-cli ping"
```

### Network
```bash
# Is the port listening?
ssh $VPS_USER@$VPS_IP "netstat -tlpn | grep $APP_PORT || ss -tlpn | grep $APP_PORT"

# DNS / external reach
curl -v --max-time 10 http://$VPS_IP:$APP_PORT/api/v1/health 2>&1
```

## Phase 2: Root Cause Analysis

Write this out before touching code:

```
ERROR MESSAGE: [exact error text from logs]

STACK TRACE POINTS TO: [file:line]

TIMELINE:
- Last working: [when did it last work?]
- First broken: [when did it break?]
- Changes between: [git log between those times]

HYPOTHESIS 1: [most likely cause]
HYPOTHESIS 2: [second most likely]
HYPOTHESIS 3: [third]

RULING OUT:
- Not X because: [evidence]
- Not Y because: [evidence]

ROOT CAUSE: [confirmed cause]
```

Do not write code until root cause is confirmed.

## Phase 3: Targeted Fix

- Fix ONLY the root cause
- Minimum lines changed
- If you're touching more than 3 files, you're probably fixing a symptom not a cause

## Phase 4: Regression Check

After fixing:
```bash
# Does the fix break anything else?
npm test 2>&1 | tail -20
npx tsc --noEmit 2>&1

# Does the original error still appear?
# [reproduce the original error scenario and verify it's gone]
```

## Phase 5: Write the Lesson

```markdown
### [DATE] — [Bug title]
**What happened**: [symptom + error message]
**Root cause**: [actual cause]
**What I checked first (wrong)**: [false leads]
**Fix**: [what was changed]
**Rule**: [one sentence that prevents this forever]
**Time to fix**: [X minutes — track this to improve]
```

> Rule: The longer a bug takes to find, the more detailed the lesson must be.
> Rule: If root cause is "I don't know why this works now" — you haven't found it. Keep digging.
