# CareDoc AI — Claude Code Prompt Files
## How to Use These Files

---

## Overview

This folder contains four phase-specific prompt files for building CareDoc AI with Claude Code. Each file is a complete, self-contained brief that tells Claude Code exactly what to build, how to build it, and where to draw the line.

Read the product documentation file (`CareDocAI-Product-Documentation.docx`) before starting. The prompts reference it frequently as the source of truth for design decisions.

---

## The Files

| File | Phase | When to Use |
|------|-------|-------------|
| `PHASE-1-FOUNDATION-MVP.md` | Foundation MVP | Start here. Builds the complete working prototype. |
| `PHASE-2-PRODUCTION-HARDENING.md` | Production Hardening | After Phase 1 is live and pilot-tested. |
| `PHASE-3-COMPLIANCE-REPORTING.md` | Compliance Reporting | After Phase 2 is stable. Requires real usage data. |
| `PHASE-4-AI-SAAS-SCALE.md` | AI Sophistication & SaaS | When commercialising. Requires paying customers. |

---

## How to Start a Claude Code Session

### For Phase 1 (first build):

```
1. Open Claude Code in your project folder (empty)
2. Upload: CareDocAI-Product-Documentation.docx
3. Upload: PHASE-1-FOUNDATION-MVP.md
4. Say: "Read both files. Then follow the Phase 1 prompt exactly."
```

### For Phase 2+:

```
1. Open Claude Code in the existing project folder
2. Upload: CareDocAI-Product-Documentation.docx
3. Upload: PHASE-[N]-[NAME].md
4. Say: "Phases 1–[N-1] are complete. Read the product doc and the Phase [N] 
        prompt. Build everything in this phase."
```

---

## Tips for Working with Claude Code on This Project

**Let it read the doc first.** The product doc has the design tokens, DB schema, API routes, and UI specs. Claude Code will cross-reference it constantly.

**One feature at a time.** Each phase has numbered features (Feature 1, Feature 2, etc.). If a session gets long, start a new session per feature: "We're on Feature 3 of Phase 2. Read the prompt file and continue from Feature 3."

**Trust the schema.** The Prisma schema in Phase 1 is complete and designed to carry all four phases. Don't let Claude Code deviate from it without a good reason.

**Check the "Done Criteria" section.** Each prompt ends with a checklist. Use it to verify the build before moving to the next phase.

**Don't skip phases.** Each phase builds on the last. Phase 2's multi-agency architecture, for example, requires Phase 1's auth and DB to be in place.

---

## Environment Setup Checklist

Before starting Phase 1, have these accounts and keys ready:

- [ ] Neon account (PostgreSQL) — neon.tech
- [ ] Vercel account — vercel.com  
- [ ] Anthropic API key — console.anthropic.com
- [ ] Resend account (email) — resend.com
- [ ] Sentry project — sentry.io
- [ ] GitHub repo created

Before Phase 2, also prepare:
- [ ] Google Maps API key (for geocoding)
- [ ] Cloudflare account + R2 bucket
- [ ] Upstash Redis instance

Before Phase 4, also prepare:
- [ ] Stripe account (live + test mode)
- [ ] VAPID key pair (generate with `npx web-push generate-vapid-keys`)

---

## Estimated Build Timeline

| Phase | Solo Developer | Small Team (2-3) |
|-------|---------------|------------------|
| Phase 1 | 6–8 weeks | 3–4 weeks |
| Phase 2 | 4–6 weeks | 2–3 weeks |
| Phase 3 | 4–5 weeks | 2–3 weeks |
| Phase 4 | Ongoing | Ongoing |

These assume Claude Code handles the implementation and a human developer is reviewing, testing, and making architectural decisions.
