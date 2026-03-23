---
name: tdd-guide
description: Test-driven development workflow. Write tests first (RED), then implement (GREEN), then refactor (IMPROVE). Use for new features and bug fixes to guarantee coverage.
---

# TDD Guide Skill — Test-Driven Development

Write the test first. Then write the code that makes it pass. Then make it clean.

---

## The TDD Loop

```
RED   → Write a failing test that describes desired behavior
GREEN → Write the minimal code to make it pass
IMPROVE → Refactor without breaking the test
```

Repeat for each small piece of behavior.

---

## Phase 1: RED — Write the Test First

Before writing any implementation code:

```javascript
// tests/unit/[feature]Service.test.js
describe('createPost', () => {
  it('should create a post with title and content', async () => {
    // Arrange
    const input = { title: 'Hello', content: 'World', userId: 'user-1' };

    // Act
    const result = await createPost(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(result.title).toBe('Hello');
    expect(result.content).toBe('World');
  });

  it('should throw when title is empty', async () => {
    await expect(createPost({ title: '', content: 'x', userId: 'u' }))
      .rejects.toThrow();
  });

  it('should throw when userId is missing', async () => {
    await expect(createPost({ title: 'Hello', content: 'World' }))
      .rejects.toThrow();
  });
});
```

Run the test — **it should fail** (RED). If it passes before implementation, the test is wrong.

```bash
npm test -- --testPathPattern=[feature] --watch
```

---

## Phase 2: GREEN — Minimum Code to Pass

Write the **simplest code that makes the test pass**. Not production code — just passing code.

```javascript
// src/services/postService.js
export async function createPost({ title, content, userId }) {
  if (!title) throw new Error('Title required');
  if (!userId) throw new Error('userId required');

  return prisma.post.create({
    data: { title, content, userId }
  });
}
```

Run the test → **it should pass** (GREEN).

---

## Phase 3: IMPROVE — Refactor

Now that tests pass, make the code production-quality:

```javascript
// Add proper error types
if (!title) throw new AppError('Title is required', 400, 'VALIDATION_ERROR');

// Add validation library if warranted
// Add proper types if TypeScript
// Extract constants if magic strings exist
```

Run tests after every refactor — they should stay GREEN.

---

## Integration Test TDD

For API routes, write the integration test first:

```javascript
// tests/integration/posts.test.js
it('POST /api/v1/posts should create post and return 201', async () => {
  const res = await request(app)
    .post('/api/v1/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Hello', content: 'World' });

  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);
  expect(res.body.data.id).toBeDefined();
});
```

Then implement the route → service → DB layer from top to bottom.

---

## TDD for Bug Fixes

When fixing a bug:

1. **Write a test that reproduces the bug** (it should fail)
2. **Fix the bug**
3. **Test passes** — and will catch regressions forever

```javascript
// Bug: user can access another user's posts
it('should return 403 when accessing another user\'s post', async () => {
  const otherPost = await createPost({ userId: 'other-user' });

  const res = await request(app)
    .get(`/api/v1/posts/${otherPost.id}`)
    .set('Authorization', `Bearer ${myToken}`);  // my token

  expect(res.status).toBe(403);  // This fails before the fix — RED
});
// Now fix the authorization check → GREEN
```

---

## Coverage Check

```bash
npm test -- --coverage 2>&1 | grep -E "Statements|Branches|Functions|Lines"
```

Target: **80%+ on new code**. Focus on:
- All service functions covered
- All error paths tested
- All auth checks tested (with and without token)

---

> Rule: A test written after the code is a test that confirms what the code does, not what it should do.
> Rule: If a feature is hard to test, the design needs work — not the test.
