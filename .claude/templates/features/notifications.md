---
name: notifications
description: Notification system template. Email (Resend/SendGrid) + in-app notifications with real-time support via SSE or WebSocket.
---

# Feature Template: Notifications

## What This Creates

- Email notifications (transactional, via Resend or SendGrid)
- In-app notification storage
- Mark as read / mark all as read
- Unread count
- Real-time push via Server-Sent Events (SSE) — no WebSocket needed

## Environment Variables Required

```env
# Email (choose one)
RESEND_API_KEY=re_...
FROM_EMAIL=notifications@yourdomain.com

# Or SendGrid
SENDGRID_API_KEY=SG....
```

## Files to Create

```
src/
├── routes/notificationRoutes.js
├── controllers/notificationController.js
├── services/notificationService.js
├── services/emailService.js     # email abstraction
├── utils/emailTemplates.js      # HTML email templates
└── sse/notificationStream.js    # SSE for real-time

prisma/schema.prisma  ← add Notification model
```

## Prisma Schema

```prisma
model Notification {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String    // "comment", "follow", "payment", etc.
  title     String
  body      String
  data      Json?     // extra payload (e.g. postId, fromUserId)
  readAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId, readAt])
  @@index([userId, createdAt])
}
```

## Routes

```
GET    /api/v1/notifications         → list notifications (paginated)
GET    /api/v1/notifications/count   → unread count
PATCH  /api/v1/notifications/:id/read       → mark one read
PATCH  /api/v1/notifications/read-all       → mark all read

GET    /api/v1/notifications/stream  → SSE endpoint for real-time
```

## Email Service Pattern

```javascript
// src/services/emailService.js
export async function sendEmail({ to, subject, html }) {
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    return resend.emails.send({ from: process.env.FROM_EMAIL, to, subject, html });
  }
  // fallback: log in dev, throw in prod
  if (process.env.NODE_ENV === 'production') throw new Error('Email service not configured');
  console.log('[EMAIL DEV]', { to, subject });
}
```

## Notification Service Pattern

```javascript
// src/services/notificationService.js
export async function createNotification({ userId, type, title, body, data }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, data }
  });

  // Push to SSE stream if user is connected
  notificationStream.push(userId, notification);

  return notification;
}
```

## SSE Real-Time Pattern

```javascript
// GET /api/v1/notifications/stream
export function notificationStream(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const userId = req.user.id;
  activeStreams.set(userId, res);

  // Send initial unread count
  res.write(`data: ${JSON.stringify({ type: 'init', unread: unreadCount })}\n\n`);

  req.on('close', () => {
    activeStreams.delete(userId);
  });
}

// Push to connected users
export function pushToUser(userId, notification) {
  const stream = activeStreams.get(userId);
  if (stream) stream.write(`data: ${JSON.stringify(notification)}\n\n`);
}
```

## Why SSE over WebSocket?

- SSE is one-directional (server → client) — perfect for notifications
- Works over HTTP/2, no special server config
- Automatic reconnection built into browser
- Much simpler than WebSocket for this use case
