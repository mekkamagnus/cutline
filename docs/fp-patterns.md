# FP Patterns - Phraser Functional Programming Patterns

This document contains common functional programming patterns used in the Phraser codebase. Each pattern includes actual code examples from the codebase.

## Quick Start

**Import from facade only:**

```typescript
import { Result, AsyncResult, AppError, AppErrorFactory } from '@/lib/fp';
```

**Basic Result usage:**

```typescript
// Safe parsing with tryCatch
const result = Result.tryCatch(
  () => JSON.parse(input),
  (e) => AppErrorFactory.validation('Invalid JSON', { original: e })
);

if (result.isErr()) {
  return errorResponse(result.unwrapErrorOr(AppErrorFactory.internal('')));
}
const data = result.unwrap();
```

**Basic AsyncResult usage:**

```typescript
// Wrap a Promise in AsyncResult
const result = await AsyncResult.fromPromise(
  fetch('/api/user'),
  (e) => AppErrorFactory.network('Fetch failed', e)
).run();

// Or use in service layer (don't run yet)
function getUser(id: string): AsyncResult<AppError, User> {
  return userAdapter.findById(id);
}
```

---

## Table of Contents

- [API Route Edge Pattern](#api-route-edge-pattern)
- [Validation with Result.tryCatch](#validation-with-resulttrycatch)
- [Nullable to Option Conversion](#nullable-to-option-conversion)
- [Option to Result Conversion](#option-to-result-conversion)
- [AsyncResult Composition Patterns](#asyncresult-composition-patterns)
- [Error Recovery Strategies](#error-recovery-strategies)
- [Parallel Async Operations](#parallel-async-operations)
- [Database Adapter Pattern](#database-adapter-pattern)
- [API Route Edge Pattern](#api-route-edge-pattern)

---

## API Route Edge Pattern

### Pattern

All API routes follow a consistent 4-step pattern: **authenticate → parse → execute → respond**. AsyncResult is executed (via `.run()`) only at the edge, keeping business logic pure.

### When to Use

- All API route handlers (GET, POST, PUT, DELETE)
- CLI entry points
- Background workers

### Real Example: POST /api/review/update-rating

From `src/app/api/review/update-rating/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { Result, AppError, AppErrorFactory } from '@/lib/fp';
import { ReviewService } from '@/lib/services/review-service';
import {
  requireAuth,
  errorResponse,
  successResponse,
  parseJsonBody,
} from '../../lib/route-utils';

export async function POST(request: NextRequest) {
  // Step 1: Authenticate (impure - at edge)
  const userOrResponse = await requireAuth(request);
  if (userOrResponse instanceof Response) {
    return userOrResponse; // Auth failed, return error response
  }
  const { id: userId } = userOrResponse;

  // Step 2: Parse and validate request body (pure validation)
  const parseResult = await parseJsonBody(request, validateUpdateRatingRequest);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppErrorFactory.internal('')));
  }
  const { phraseId, rating } = parseResult.unwrap();

  // Step 3: Execute business logic (pure composition via ReviewService)
  const result = await ReviewService.updateRating(phraseId, userId, rating, new Date()).run();

  // Step 4: Respond (impure - at edge)
  return result.match({
    ok: (reviewResult) => successResponse({
      success: true,
      phraseId: reviewResult.phraseId,
      rating: reviewResult.rating,
      nextReviewDate: reviewResult.nextReviewDate.toISOString(),
    }),
    err: errorResponse,
  });
}

// Validator function (pure validation)
function validateUpdateRatingRequest(body: unknown): Result<AppError, UpdateRatingRequest> {
  if (typeof body !== 'object' || body === null) {
    return Result.err(AppErrorFactory.validation('Request body must be an object'));
  }
  const b = body as Record<string, unknown>;

  // Validate phraseId
  if (typeof b.phraseId !== 'number' || b.phraseId < 1) {
    return Result.err(AppErrorFactory.validation('phraseId must be a positive integer'));
  }

  // Validate rating
  const validRatings = ['again', 'hard', 'good', 'easy'] as const;
  if (typeof b.rating !== 'string' || !validRatings.includes(b.rating as any)) {
    return Result.err(AppErrorFactory.validation(`rating must be one of: ${validRatings.join(', ')}`));
  }

  return Result.ok({ phraseId: b.phraseId, rating: b.rating });
}
```

### Real Example: GET /api/phrases/list (with query params)

From `src/app/api/phrases/list/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  // Step 1: Authenticate (impure - at edge)
  const userOrResponse = await requireAuth(request);
  if (userOrResponse instanceof Response) return userOrResponse;
  const { id: userId } = userOrResponse;

  // Step 2: Parse query parameters (pure validation)
  const { searchParams } = new URL(request.url);
  const parseResult = parseListPhrasesQuery(searchParams);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppErrorFactory.internal('')));
  }
  const { page, limit, tag } = parseResult.unwrap();

  // Step 3: Execute business logic (impure at edge - complex DB query)
  // ... database operations ...

  // Step 4: Respond (impure - at edge)
  return successResponse({ phrases, pagination });
}

// Validator for query parameters
function parseListPhrasesQuery(searchParams: URLSearchParams): Result<AppError, ListPhrasesQuery> {
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  const page = parsePageParam(pageParam, 1);
  const limit = parseLimitParam(limitParam, 10, 100);

  if (page < 1) {
    return Result.err(AppErrorFactory.validation('Page must be positive', { received: page }));
  }

  return Result.ok({ page, limit, tag: searchParams.get('tag') ?? undefined });
}
```

### Real Example: POST /api/auth/send-temp-password (no auth, security-focused)

From `src/app/api/auth/send-temp-password/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  // Step 1: Parse and validate (no auth for this endpoint)
  const parseResult = await parseJsonBody(request, validateSendTempPasswordRequest);
  if (parseResult.isErr()) {
    // Still return success to prevent email enumeration
    return successResponse({
      message: 'If an account exists, a login code has been sent.',
    });
  }
  const { email } = parseResult.unwrap();

  // Step 2: Execute business logic (ignore errors for security)
  await AuthService.createTempPassword(email, new Date()).run();

  // Step 3: Always return success (email enumeration protection)
  return successResponse({
    message: 'If an account exists, a login code has been sent.',
  });
}
```

### Error Status Mapping

From `src/app/api/lib/route-utils.ts`:

```typescript
export const ERROR_STATUS_MAP: Record<AppErrorKind, number> = {
  validation: 400,
  'not-found': 404,
  database: 500,
  network: 503,
  authentication: 401,
  authorization: 403,
  'rate-limit': 429,
  'service-unavailable': 503,
  internal: 500,
} as const;

export function errorResponse(error: AppError): Response {
  const status = ERROR_STATUS_MAP[error.kind] ?? 500;
  return new Response(
    JSON.stringify({ error: error.kind, message: error.message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
```

---

## Validation with Result.tryCatch

### Pattern

Wrap synchronous operations that may throw in `Result.tryCatch` to convert exceptions into typed errors.

### When to Use

- Parsing JSON
- Validating user input
- Any synchronous operation that might throw

### Example from Facade Tests

```typescript
// src/lib/fp/__tests__/result.test.ts
import { Result } from '../result';
import { AppError } from '../errors';

// Safe JSON parsing
const parseJson = (input: string): Result<AppError, unknown> =>
  Result.tryCatch(
    () => JSON.parse(input),
    (e) => AppError.validation('Invalid JSON', { original: e })
  );

// Usage
const result = parseJson('{"valid": true}');
if (result.isOk()) {
  const data = result.unwrapOr(null);
  // Use parsed data
} else {
  const error = result.unwrapErrorOr(AppError.internal(''));
  console.error(error.message);
}
```

### Example with AppError Integration

```typescript
// src/lib/fp/__tests__/result.test.ts
const result = Result.tryCatch(
  () => JSON.parse('{"valid": true}'),
  (e) => AppError.validation('Invalid JSON', { original: e })
);

// Transform the success value
const withValid = result.map(parsed => parsed.valid);
expect(withValid.unwrapOr(false)).toBe(true);
```

---

## Nullable to Option Conversion

### Pattern

Use `Option.fromNullable` to convert nullable values (null/undefined) into Option<T>.

### When to Use

- Database queries that return null
- Optional properties on objects
- Any value that might be null or undefined

### Example from Facade

```typescript
// src/lib/fp/option.ts
import { Option } from '@/lib/fp';

// Converting a nullable database result
const user = db.findUser(id); // Returns User | null
const userOption = Option.fromNullable(user);

// Safely transform
const email = userOption
  .map(u => u.email)
  .unwrapOr('unknown@example.com');
```

### Preserving Falsy Values

`Option.fromNullable` only converts null/undefined to None, not other falsy values:

```typescript
// From option.test.ts
Option.fromNullable(0);       // Some(0) - 0 is a valid value
Option.fromNullable('');      // Some('') - empty string is valid
Option.fromNullable(false);   // Some(false) - false is valid
Option.fromNullable(null);    // None
Option.fromNullable(undefined); // None
```

---

## Option to Result Conversion

### Pattern

Convert Option to Result using `fromOption` when you need to provide an error for None values.

### When to Use

- Validating that a required value exists
- Converting optional database results to error cases
- Boundary between Option and Result code

### Example from Facade

```typescript
// src/lib/fp/result.ts
import { fromOption } from '@/lib/fp';
import { Option } from '@/lib/fp';
import { AppError } from '@/lib/fp';

// Find user by email - returns Option
const userOption = Option.fromNullable(db.findByEmail(email));

// Convert to Result with specific error
const userResult = fromOption(
  userOption,
  () => AppError.notFound('User', `email: ${email}`)
);

// Now you can use Result operations
userResult.andThen(user => validateUser(user));
```

---

## AsyncResult Composition Patterns

### Pattern

Chain async operations together using `andThen` for sequential execution.

### When to Use

- Multi-step async workflows
- Service layer business logic
- Any sequence of async operations that may fail

### Example Service Pattern

```typescript
// src/lib/services/user-service.ts
import { AsyncResult, AppError } from '@/lib/fp';

class UserService {
  processUser(id: string): AsyncResult<AppError, User> {
    return this.userAdapter
      .findById(id)
      .andThen(user => this.validate(user))
      .andThen(user => this enrich(user))
      .andThen(user => this.save(user));
  }

  private validate(user: User): AsyncResult<AppError, User> {
    if (!user.email) {
      return AsyncResult.err(AppError.validation('Email required'));
    }
    return AsyncResult.ok(user);
  }

  private enrich(user: User): AsyncResult<AppError, User> {
    // Add enrichment logic
    return AsyncResult.ok({ ...user, enriched: true });
  }

  private save(user: User): AsyncResult<AppError, User> {
    return this.userAdapter.update(user.id, user);
  }
}
```

### Using andThenPromise

```typescript
// src/lib/fp/async-result.ts
import { AsyncResult } from '@/lib/fp';

// Chain with a Promise-returning function
const result = await AsyncResult.ok(userId)
  .andThenPromise(
    (id) => fetchUserFromAPI(id),
    (e) => AppError.network('Failed to fetch user', e)
  )
  .run();
```

---

## Error Recovery Strategies

### Pattern

Use `recoverWith` to handle errors and provide fallback AsyncResult values.

### When to Use

- Providing default values on failure
- Implementing retry logic
- Graceful degradation

### Example from Facade

```typescript
// src/lib/fp/async-result.ts
import { AsyncResult, AppError } from '@/lib/fp';

// Recover with a default value
const result = await externalAPI.call()
  .recoverWith((error) =>
    error.kind === 'service-unavailable'
      ? AsyncResult.ok(getCachedData())
      : AsyncResult.err(error)
  )
  .run();

// Conditional recovery based on error kind
const userResult = await userAdapter.findById(id)
  .recoverWith((error) => {
    if (error.kind === 'not-found') {
      return userAdapter.createGuestUser();
    }
    return AsyncResult.err(error); // Re-throw other errors
  })
  .run();
```

### Using mapError for Error Transformation

```typescript
// Transform specific errors to more generic ones
const result = await databaseOperation()
  .mapError((error) => {
    if (error.kind === 'database') {
      return AppError.internal('Database operation failed', error);
    }
    return error;
  })
  .run();
```

---

## Parallel Async Operations

### Pattern

Use `AsyncResult.all` or `AsyncResult.parallelCombine` for parallel execution of **independent** operations. Use `combine()` for **sequential** operations when the second depends on the first.

### ⚠️ Important: Sequential vs Parallel

| Method | Execution Order | Use When |
|--------|-----------------|----------|
| `combine(other)` | **Sequential** - runs `this` first, then `other` | Second operation depends on first's result |
| `parallelCombine(other)` | **Parallel** - runs both concurrently | Operations are independent |
| `AsyncResult.all(array)` | **Parallel** - runs all array items concurrently | Independent operations in a loop |

**Performance note:** Parallel execution is ~2x faster for I/O-bound operations (database queries, API calls). Always prefer `parallelCombine` or `all` for independent operations.

### When to Use Each

- **Use `combine()`** when: You need the result of the first operation to perform the second
- **Use `parallelCombine()`** when: Both operations can run at the same time (e.g., fetching user + settings)
- **Use `all()`** when: You have an array of independent operations

### Example from Facade

```typescript
// src/lib/fp/async-result.ts
import { AsyncResult } from '@/lib/fp';

// ❌ WRONG - Using combine for independent operations (slower!)
const [user, settings] = await userAdapter.findById(userId)
  .combine(settingsAdapter.findByUserId(userId))  // Sequential!
  .unwrapOr([null, null]);

// ✅ RIGHT - Using parallelCombine for independent operations
const [user, settings] = await AsyncResult.parallelCombine(
  userAdapter.findById(userId),
  settingsAdapter.findByUserId(userId)
).unwrapOr([null, null]);

// ✅ RIGHT - Using combine when second depends on first
const userWithSettings = await userAdapter.findById(userId)
  .andThen(user => settingsAdapter.findByUserId(user.id)  // Needs user.id
  .map(settings => ({ user, settings }))
  .unwrapOr(null);

// All operations in an array (parallel)
const results = await AsyncResult.all([
  fetchUser(id),
  fetchPosts(id),
  fetchProfile(id)
]).unwrapOr([]);

// AllSettled - continues even if some fail
const settled = await AsyncResult.allSettled([
  fetchUser(id),
  fetchPosts(id),
  fetchProfile(id)
]).unwrapOr([]);

// settled is Array<Result<AppError, T>>
```

---

## Database Adapter Pattern

### Pattern

Create adapter classes that convert Drizzle ORM results to AsyncResult.

### When to Use

- All database operations
- Boundary between database layer and business logic

### Example Structure

```typescript
// src/lib/db/adapters.ts
import { AsyncResult, AppError, asyncResult } from '@/lib/fp';
import { db } from '@/db/index';

class UserAdapter {
  findById(id: number): AsyncResult<AppError, User> {
    return asyncResult.fromPromise(
      db.query.users.findFirst({ where: eq(users.id, id) }),
      (e) => AppError.database('Failed to fetch user', e)
    ).andThen(user => {
      if (!user) {
        return AsyncResult.err(AppError.notFound('User', String(id)));
      }
      return AsyncResult.ok(user);
    });
  }

  findByEmail(email: string): AsyncResult<AppError, User> {
    return asyncResult.fromPromise(
      db.query.users.findFirst({ where: eq(users.email, email) }),
      (e) => AppError.database('Failed to fetch user by email', e)
    ).andThen(user => {
      if (!user) {
        return AsyncResult.err(AppError.notFound('User', `email: ${email}`));
      }
      return AsyncResult.ok(user);
    });
  }

  create(email: string): AsyncResult<AppError, User> {
    return asyncResult.fromPromise(
      db.insert(users).values({ email }).returning(),
      (e) => AppError.database('Failed to create user', e)
    ).andThen(([user]) => AsyncResult.ok(user));
  }
}

export const userAdapter = new UserAdapter();
```

---

## API Route Edge Pattern

### Pattern

Execute AsyncResult only at the edge (API route), keep business logic pure.

### When to Use

- All API route handlers
- CLI entry points
- Worker jobs

### Example Route Handler

```typescript
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/user-service';
import { AppError } from '@/lib/fp';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Parse and validate (edge: impure)
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: 'Invalid user ID' },
      { status: 400 }
    );
  }

  // 2. Execute business logic (pure composition)
  const result = await userService.getUser(id).run();

  // 3. Convert Result to HTTP response (edge: impure)
  return result.match({
    ok: (user) => NextResponse.json({ user }),
    err: (error) => {
      const status = statusCodeForError(error);
      return NextResponse.json(
        { error: error.message, kind: error.kind },
        { status }
      );
    },
  });
}

function statusCodeForError(error: AppError): number {
  switch (error.kind) {
    case 'validation': return 400;
    case 'not-found': return 404;
    case 'authentication': return 401;
    case 'authorization': return 403;
    case 'rate-limit': return 429;
    case 'database':
    case 'internal': return 500;
    case 'network':
    case 'service-unavailable': return 503;
    default: return 500;
  }
}
```

---

## Filter Pattern with Option

### Pattern

Use `filter` to conditionally keep or discard Option values.

### When to Use

- Validating conditions on optional values
- Filtering collections of Options

### Example from Facade Tests

```typescript
// src/lib/fp/__tests__/option.test.ts
import { Option } from '../option';

// Filter keeps Some if predicate matches
const option = Option.some(5);
const filtered = option.filter(x => x > 3);
// filtered is Some(5)

// Returns None if predicate fails
const option2 = Option.some(5);
const filtered2 = option2.filter(x => x > 10);
// filtered2 is None
```

---

## Combine Pattern

### Pattern

Use `combine` to pair two Results/AsyncResults (both must succeed).

### When to Use

- Gathering independent pieces of data
- Combining results from multiple sources

### Example from Facade Tests

```typescript
// src/lib/fp/__tests__/result.test.ts
import { Result } from '../result';
import { AppError } from '@/lib/fp';

const a = Result.ok<AppError, number>(5);
const b = Result.ok<AppError, string>('hello');
const combined = a.combine(b);
// combined is Ok([5, 'hello'])

// Fails if first is Err
const error = { kind: 'error', message: 'failed' };
const c = Result.err<AppError, number>(error);
const d = Result.ok<AppError, string>('hello');
const combined2 = c.combine(d);
// combined2 is Err(error)
```

---

## Match Pattern for Branching

### Pattern

Use `match` to handle both success and error cases explicitly.

### When to Use

- Converting Result/Option to other types
- Conditional logic based on success/failure
- At the edge before returning responses

### Example from Facade Tests

```typescript
// src/lib/fp/__tests__/result.test.ts
import { Result } from '../result';

const result = Result.ok<TestError, number>(42);
const matched = result.match({
  ok: (value) => `got ${value}`,
  err: (error) => `error: ${error.message}`,
});
// matched is "got 42"

const errorResult = Result.err<TestError, number>({ kind: 'error', message: 'failed' });
const matchedError = errorResult.match({
  ok: (value) => `got ${value}`,
  err: (error) => `error: ${error.message}`,
});
// matchedError is "error: failed"
```

---

## Summary

| Pattern | Use Case | Key Types |
|---------|----------|-----------|
| `Result.tryCatch` | Safe throwing operations | Result |
| `Option.fromNullable` | Null/undefined handling | Option |
| `fromOption` | Option → Result conversion | Option → Result |
| `andThen` | Sequential async composition | AsyncResult |
| `recoverWith` | Error handling fallbacks | AsyncResult |
| `AsyncResult.all` | Parallel async operations | AsyncResult |
| `AsyncResult.parallelCombine` | Pair parallel operations | AsyncResult |
| `filter` | Conditional Option values | Option |
| `combine` | Combine two Results | Result |
| `match` | Handle both cases | Result, Option |

---

## Related Documentation

- [fp-ts Rules](./fp-ts-rules.md) - Core rules for the FP facade
- [FP Anti-Patterns](./fp-anti-patterns.md) - Common mistakes to avoid
- [CHORE-005](../specs/CHORE-005-semi-strict-fp-refactor.md) - Refactoring specification

---

## Option Combinators Over If Statements

### Pattern

**Prefer Option/Result combinators over imperative if statements.**

This pattern makes code:
- More declarative (what, not how)
- Easier to test (pure functions)
- Less prone to bugs (no nested conditionals)
- Self-documenting (each combinator has a clear purpose)

### When to Use

- All conditional logic that checks for null/undefined
- Guard conditions (multiple conditions that must all pass)
- Fallback chains (try first, then second, etc.)
- Error mapping/transformation

### ❌ Avoid: Imperative If Statements

```typescript
function getSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('phraser_session='));

  if (!sessionCookie) {
    return null;
  }

  const value = sessionCookie.split('=')[1];
  if (!value || value.length === 0) {
    return null;
  }

  return value;
}
```

### ✅ Prefer: Option Combinators

```typescript
function getSessionCookie(request: Request): string | null {
  return Option.fromNullable(request.headers.get('cookie'))
    .andThen(cookieHeader =>
      Option.fromNullable(
        cookieHeader
          .split(';')
          .map(c => c.trim())
          .find(c => c.startsWith('phraser_session='))
      )
    )
    .andThen(sessionCookie =>
      Option.fromNullable(sessionCookie.split('=')[1])
        .filter((value): value is string => value.length > 0)
    )
    .toNullable();
}
```

### Guard Chain Pattern

Use filter chains for multiple guard conditions:

```typescript
// ❌ Avoid: Nested if guards
function getTestUser(request: Request): User | null {
  if (process.env.DEPLOYMENT_ENV === 'production') {
    return null;
  }
  if (!process.env.TEST_AUTH_TOKEN || !process.env.TEST_USER_EMAIL) {
    return null;
  }
  const testAuthHeader = request.headers.get('x-test-auth');
  if (testAuthHeader !== process.env.TEST_AUTH_TOKEN) {
    return null;
  }
  return createTestUser();
}

// ✅ Prefer: Filter chain
function getTestUser(request: Request): User | null {
  return Option.some(undefined)
    .filter(() => process.env.DEPLOYMENT_ENV !== 'production')
    .filter(() => !!(process.env.TEST_AUTH_TOKEN && process.env.TEST_USER_EMAIL))
    .filter(() => {
      const testAuthHeader = request.headers.get('x-test-auth');
      return testAuthHeader === process.env.TEST_AUTH_TOKEN;
    })
    .map(() => createTestUser())
    .toNullable();
}
```

### Fallback Chain Pattern

Try multiple strategies, use first that succeeds:

```typescript
// ❌ Avoid: If-else chain
function getAuthenticatedUser(request: Request): User {
  const testUser = getTestUser(request);
  if (testUser) {
    return testUser;
  }
  const sessionUser = getSessionUser(request);
  if (sessionUser) {
    return sessionUser;
  }
  throw new AuthError('Not authenticated');
}

// ✅ Prefer: OrElse chain
function getAuthenticatedUser(request: Request): User {
  return Option.fromNullable(getTestUser(request))
    .orElse(() => Option.fromNullable(getSessionUser(request)))
    .unwrapOrElse(() => { throw new AuthError('Not authenticated'); });
}
```

### Error Mapping with Lookup Table

Replace if-else error transformation with data-driven lookup:

```typescript
// ❌ Avoid: If-else error mapping
function mapError(error: AppError): AppError {
  if (error.kind === 'not-found') {
    return AuthError.authentication('Invalid session');
  }
  if (error.kind === 'database') {
    return error;
  }
  return error;
}

// ✅ Prefer: Lookup table
function mapError(error: AppError): AppError {
  const errorTransforms: Record<string, () => AppError> = {
    'not-found': () => AuthError.authentication('Invalid session'),
    'database': () => error,
    'network': () => error,
  };

  return Option.fromNullable(errorTransforms[error.kind])
    .map(fn => fn())
    .unwrapOr(error);
}
```

### Key Combinators Reference

| Combinator | Purpose | Example |
|------------|---------|---------|
| `Option.fromNullable(x)` | Wrap potentially null value | `Option.fromNullable(user)` |
| `.filter(fn)` | Keep only if predicate passes | `.filter(x => x > 0)` |
| `.andThen(fn)` | Chain operations returning Option | `.andThen(u => getAvatar(u))` |
| `.map(fn)` | Transform the value | `.map(u => u.email)` |
| `.orElse(fn)` | Provide fallback Option | `.orElse(() => getGuest())` |
| `.unwrapOrElse(fn)` | Get value or compute default | `.unwrapOrElse(() => 'default')` |
| `.toNullable()` | Convert back for interop | `return opt.toNullable()` |

### Real Example: AuthService

From `src/lib/services/auth-service.ts`:

```typescript
static getAuthenticatedUser(
  request: Request,
  now: Date
): AsyncResult<AppError, User> {
  // Use Option combinators with method chaining for clean auth chain
  return Option.fromNullable(this.getTestUser(request))
    .orElse(() => this.trySessionAuth(request, now))
    .unwrapOrElse(() =>
      AsyncResult.err(AppErrorFactory.authentication('No valid authentication found'))
    );
}

private static getSessionCookie(request: Request): string | null {
  return Option.fromNullable(request.headers.get('cookie'))
    .andThen(cookieHeader =>
      Option.fromNullable(
        cookieHeader.split(';').map(c => c.trim())
          .find(c => c.startsWith('phraser_session='))
      )
    )
    .andThen(sessionCookie =>
      Option.fromNullable(sessionCookie.split('=')[1])
        .filter((value): value is string => value.length > 0)
    )
    .toNullable();
}
```
