---
name: brownfield-onboarding
description: Brownfield project intake workflow. Scans an existing repo, identifies stack and commands, marks no-touch zones, and captures the minimum architecture context needed before planning.
---

# Brownfield Onboarding Skill

Use this before changing an existing codebase that Claude did not scaffold.

The goal is to avoid acting like the repo is greenfield when it already has patterns, history, and landmines.

---

## Step 1: Scan The Repo

```bash
node .claude/scripts/project-scan.js
```

Capture:
- stack
- package manager
- test/build/dev commands
- key directories
- whether CI/docs/migrations already exist

---

## Step 2: Identify No-Touch Zones

Before planning, write down:
- files with active unrelated work
- generated files
- deployment config you should not casually edit
- risky areas like auth, migrations, billing, or infra

Put these in `PRIORITY-WORK.md` under "Do Not Touch Until Current Task Is Done".

---

## Step 3: Find The Existing Patterns

Read only the minimum:
1. `memory/current-context.json` if present
2. `PRIORITY-WORK.md`
3. key framework entrypoints
4. one representative feature in the area you will edit

Do not scan the whole repo.

---

## Step 4: Capture The Brownfield Brief

Write a short brief with:
- what this repo appears to be
- what commands actually run it
- which directories matter for the current task
- what not to break
- the first safe plan boundary

---

## Step 5: Only Then Plan

Once the brownfield brief exists:
- run `/plan`
- touch only files justified by the brief

---

> Rule: Existing codebases are not blank canvases.
> Rule: Brownfield work starts with discovery constraints, not implementation enthusiasm.
