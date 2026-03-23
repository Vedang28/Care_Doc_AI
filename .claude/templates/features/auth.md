---
name: auth
description: Authentication feature template. JWT access + refresh tokens, register, login, logout, password reset. Works with Express/Prisma stack.
---

# Feature Template: Authentication

## What This Creates

- Register with email + password
- Login → JWT access token (15min) + refresh token (7d, httpOnly cookie)
- Refresh token rotation (refresh → new pair, old invalidated)
- Logout (invalidate refresh token)
- Forgot password + reset via email token
- `authenticate` middleware
- `requireRole` middleware

## Files to Create

```
src/
├── routes/authRoutes.js
├── controllers/authController.js
├── services/authService.js
├── middleware/authenticate.js
├── middleware/requireRole.js
├── utils/tokens.js
└── validators/authValidators.js

prisma/schema.prisma  ← add User, RefreshToken models
tests/integration/auth.test.js
```

## Prisma Schema

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  password     String    // hashed
  name         String?
  role         String    @default("user")  // user, admin
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  refreshTokens RefreshToken[]

  @@index([email])
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
  revokedAt DateTime?

  @@index([token])
  @@index([userId])
}
```

## Key Functions in authService.js

```javascript
register(email, password, name)       // hash pw, create user, issue tokens
login(email, password)                // verify creds, issue tokens
refresh(refreshToken)                 // rotate: revoke old, issue new pair
logout(refreshToken)                  // revoke token
forgotPassword(email)                 // send reset email
resetPassword(token, newPassword)     // verify token, update password
```

## Environment Variables Required

```env
JWT_SECRET=min-32-chars-strong-secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
RESEND_API_KEY=           # for password reset emails
FROM_EMAIL=noreply@yourdomain.com
```

## Security Notes

- Never store plain text passwords — use bcrypt (cost ≥ 12) or argon2
- Refresh tokens stored in DB — allows server-side revocation
- Access tokens are stateless JWTs — short expiry (15min)
- Password reset tokens: one-time use, expire in 1 hour
- Rate limit: POST /auth/register and POST /auth/login (5 requests/15min)
- Logout from all devices: revoke ALL refresh tokens for user
