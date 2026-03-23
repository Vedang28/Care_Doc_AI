---
name: nextjs-fullstack
description: Next.js 14 App Router + Prisma + PostgreSQL + Tailwind. Full-stack with API routes, server components, and server actions.
---

# Stack Template: Next.js Fullstack

## CLAUDE.md Tech Stack Section

```markdown
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Styling | Tailwind CSS 3 |
| Auth | NextAuth.js v5 / Lucia |
| Validation | Zod |
| State | Zustand / Server State only |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions → Vercel |
```

## Folder Structure

```
project/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   └── [feature]/page.tsx
│   ├── api/
│   │   └── v1/
│   │       └── [resource]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           # shadcn/ui or custom primitives
│   └── features/     # feature-specific components
├── lib/
│   ├── db.ts         # Prisma singleton
│   ├── auth.ts       # NextAuth config
│   ├── validations/  # Zod schemas
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   └── e2e/          # Playwright
├── docs/
│   └── plans/
└── .env.local
```

## Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Auth (NextAuth)
NEXTAUTH_SECRET=your-secret-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# OAuth (if using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Initial Setup Commands

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false
npm install prisma @prisma/client next-auth@beta zod lucide-react
npm install -D vitest @testing-library/react playwright
npx prisma init
```

## API Route Pattern

```typescript
// app/api/v1/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSchema } from '@/lib/validations/[resource]';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Validation error', code: 'VALIDATION_ERROR' }, { status: 400 });

    const result = await createResource(parsed.data, session.user.id);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
```

## Server Actions Pattern (for forms)

```typescript
// lib/actions/[resource].ts
'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';

export async function createResourceAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  // Process, revalidate, return
  revalidatePath('/dashboard');
}
```

## Key Patterns

- API routes: `/app/api/v1/[resource]/route.ts`
- Response shape same as other stacks: `{ success, data, message }`
- Auth: NextAuth session in server components and API routes
- Prisma: singleton in `lib/db.ts` — `const globalForPrisma = global as typeof globalThis & { prisma: PrismaClient }`
- Deployment: Vercel auto-deploys on push to main
