---
name: node-express
description: Node.js + Express + React/Vite + Prisma + PostgreSQL + Redis + BullMQ stack template. Full-stack with background jobs and caching.
---

# Stack Template: Node.js + Express

## CLAUDE.md Tech Stack Section

```markdown
| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Backend | Express 4 |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 + BullMQ |
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Auth | JWT + bcrypt/argon2 |
| Validation | Zod |
| Testing | Vitest + Supertest |
| CI/CD | GitHub Actions → SSH → PM2 |
```

## Folder Structure

```
project/
├── src/
│   ├── routes/           # Express routers
│   ├── controllers/      # HTTP layer — thin, delegates to services
│   ├── services/         # Business logic
│   ├── middleware/       # authenticate, requireRole, validate, errorHandler
│   ├── queues/           # BullMQ queue definitions and workers
│   ├── config/           # db.js (Prisma singleton), redis.js, logger.js
│   └── utils/            # tokens.js, helpers
├── client/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── store/        # Zustand / Redux
│       ├── lib/          # api.js (Axios instance), queryClient.js
│       └── hooks/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── helpers/
├── docs/
│   ├── plans/
│   └── audits/
├── logs/
├── .env.example
└── .gitignore
```

## Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-min-32-chars-long-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email (optional)
RESEND_API_KEY=
FROM_EMAIL=noreply@yourdomain.com
```

## Initial Setup Commands

```bash
# Backend
npm init -y
npm install express prisma @prisma/client redis bullmq bcryptjs jsonwebtoken zod winston cors helmet express-rate-limit dotenv
npm install -D typescript @types/express @types/node vitest supertest

# Frontend
npm create vite@latest client -- --template react-ts
cd client && npm install axios @tanstack/react-query zustand react-router-dom tailwindcss

# Database
npx prisma init
npx prisma migrate dev --name init
```

## App Entry Pattern

```javascript
// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authenticate, userRoutes);

// Error handler — MUST be last
app.use(errorHandler);

export { app };
```

## Key Patterns

- Response shape: `{ success, data, message }` / `{ success, error, code }`
- Errors: throw `AppError(message, statusCode, code)` — caught by errorHandler
- Auth: `authenticate` middleware → `req.user`
- Roles: `requireRole('admin')` after authenticate
- Validation: `validate(schema)` middleware using Zod
- DB: singleton Prisma client exported from `src/config/db.js`
- Queues: BullMQ queue + worker pattern in `src/queues/`
