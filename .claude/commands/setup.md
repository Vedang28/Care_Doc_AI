---
name: setup
description: Project setup wizard. Detects or asks for stack, fills CLAUDE.md, scaffolds folder structure, verifies environment. Run once when starting any project.
---

# /setup — Project Setup Wizard

Zero to working project in one command.

---

## Phase 1: Detect Existing Context

```bash
# Check if existing project
ls package.json pyproject.toml Cargo.toml go.mod 2>/dev/null
git log --oneline -3 2>/dev/null
node .claude/scripts/project-scan.js
```

- **Existing project detected** → offer to analyze it and fill CLAUDE.md from what's found
- **New project** → proceed to stack selection

If existing project detected:
- load `brownfield-onboarding`
- do not scaffold over the repo blindly

---

## Phase 2: Stack Selection

Present this menu:

```
Which stack are you building with?

  A) Next.js Fullstack       (Next.js 14, Prisma, PostgreSQL, Tailwind)
  B) Node.js + React         (Express, React/Vite, Prisma, Redis, BullMQ)
  C) Python API              (FastAPI, SQLAlchemy, PostgreSQL, Celery)
  D) T3 Stack                (Next.js, tRPC, Prisma, Tailwind, NextAuth)
  E) Go Backend              (Go, Fiber, GORM, PostgreSQL)
  F) React SPA               (React/Vite, TanStack Query, external API)
  G) Custom                  (I'll describe my stack)

Enter A–G:
```

Load the corresponding template from `templates/stacks/[choice].md`.
Apply the stack's folder structure, dependencies, and CLAUDE.md tech stack section.

---

## Phase 3: Collect Project Identity

Ask for:
1. **Project name**
2. **One-line purpose** (what problem does it solve?)
3. **GitHub repo URL** (or "not set up yet")
4. **Deployment target**: VPS / Vercel / Railway / Fly.io / local only
5. If VPS: IP, user, app path, PM2 process name
6. **Required env vars** (list names, not values)

Fill all fields in CLAUDE.md.

---

## Phase 4: Scaffold Folder Structure

Based on the selected template, create directories and starter files:

```bash
# Example for Node.js + React
mkdir -p src/{routes,controllers,services,middleware,queues,config,utils}
mkdir -p client/src/{pages,components,store,lib,hooks,types}
mkdir -p prisma
mkdir -p tests/{unit,integration,e2e}
mkdir -p docs/{phases,plans,audits}
mkdir -p logs

touch .env.example
touch .gitignore
```

Create:
- `.env.example` with all required env vars (no values)
- `docs/plans/` directory for plan documents
- Initial `lessons.md` with format template
- Stack-appropriate `.gitignore`

---

## Phase 5: Environment Verification

```bash
echo "=== Required Tools ==="
# Check stack-appropriate tools
node --version 2>/dev/null && echo "✅ Node.js" || echo "❌ Node.js missing"
git --version 2>/dev/null && echo "✅ Git" || echo "❌ Git missing"

echo "=== Environment Files ==="
[ -f .env ] && echo "✅ .env found" || echo "⚠️  No .env — copy from .env.example and fill values"

echo "=== Database ==="
# Stack-appropriate DB check
```

---

## Phase 6: Git Initialization

```bash
[ -d .git ] || git init

# Write .gitignore appropriate to stack
# Commit the scaffolded structure
git add .gitignore .env.example
git commit -m "chore: initial project setup via /setup"
```

---

## Phase 7: Setup Report

```
✅ SETUP COMPLETE
─────────────────────────────────
Project:        [Name]
Stack:          [Selected]
Folders:        ✅ Created
.env.example:   ✅ Created
Git:            ✅ Initialized
CLAUDE.md:      ✅ Filled

NEXT STEPS:
1. Copy .env.example → .env and fill in real values
2. Run /doctor to verify everything is working
3. Run /plan [first task] to start building
─────────────────────────────────
```

---

## Stack-Specific Notes

After selecting a template, read `templates/stacks/[choice].md` for:
- Exact folder structure
- Key dependencies to install
- Common patterns for that stack
- Initial commands to run

> Rule: /setup runs once per project. If you need to re-scaffold, run /doctor first to see what's already there.
