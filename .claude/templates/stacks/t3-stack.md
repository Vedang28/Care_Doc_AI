---
name: t3-stack
description: T3 Stack — Next.js + TypeScript + tRPC + Prisma + Tailwind + NextAuth. Type-safe full-stack.
---

# Stack Template: T3 Stack

## CLAUDE.md Tech Stack Section

```markdown
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| API | tRPC v11 |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Auth | NextAuth.js v5 |
| Styling | Tailwind CSS 3 |
| Validation | Zod |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions → Vercel |
```

## Initial Setup

```bash
npx create-t3-app@latest
# Select: TypeScript, tRPC, Prisma, NextAuth, Tailwind
```

## Folder Structure (T3 App Router)

```
src/
├── app/
│   ├── _trpc/         # tRPC provider setup
│   ├── (auth)/        # Auth pages
│   └── (dashboard)/   # Protected pages
├── server/
│   ├── api/
│   │   ├── routers/   # tRPC routers (one per feature)
│   │   ├── root.ts    # Merge all routers
│   │   └── trpc.ts    # tRPC init, context, middleware
│   ├── auth.ts        # NextAuth config
│   └── db.ts          # Prisma singleton
├── trpc/
│   ├── react.tsx      # Client-side tRPC hooks
│   └── server.ts      # Server-side caller
└── lib/
    └── validations/   # Zod schemas
```

## tRPC Router Pattern

```typescript
// src/server/api/routers/post.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

export const postRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.post.findMany({
        take: input.limit,
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),
});
```

## Client Usage

```typescript
// In React components
const { data, isLoading } = api.post.list.useQuery({ limit: 20 });
const createPost = api.post.create.useMutation({
  onSuccess: () => utils.post.list.invalidate(),
});
```

## Key Benefits of T3

- **End-to-end type safety**: change the server schema, TypeScript errors appear in the client immediately
- **No API design needed**: tRPC is RPC-style, not REST
- **Auto-generated types**: never write type definitions for API responses

## Key Patterns

- Protected procedures: use `protectedProcedure` for authenticated routes (throws 401 automatically)
- Error handling: tRPC `TRPCError` for typed errors
- Response shape: tRPC handles this — just return data, errors are thrown
- DB: singleton Prisma in `src/server/db.ts`
