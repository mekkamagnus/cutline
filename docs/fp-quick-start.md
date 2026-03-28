# FP Quick Start - Phraser Functional Programming

A quick reference for using the Phraser FP facade in your daily work.

## Import Pattern

**Always import from the facade:**

```typescript
import { Option, Result, AsyncResult, AppError, AppErrorFactory } from '@/lib/fp';
```

**Never import fp-ts directly:**

```typescript
// ❌ WRONG
import { Option, some } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';

// ✅ RIGHT
import { Option } from '@/lib/fp';
```

---

## Core Types

| Type | Use Case | Key Methods |
|------|----------|-------------|
| `Option<T>` | Nullable values | `map()`, `andThen()`, `unwrapOr()`, `isSome()` |
| `Result<E, T>` | Operations that can fail | `map()`, `andThen()`, `mapError()`, `unwrapOr()`, `match()` |
| `AsyncResult<E, T>` | Async operations that can fail | `map()`, `andThen()`, `recoverWith()`, `run()` |
| `AppError` | Single error type | Created via `AppErrorFactory.validation()`, etc. |

---

## Common Patterns

### 1. Parse JSON safely

```typescript
const result = Result.tryCatch(
  () => JSON.parse(input),
  (e) => AppErrorFactory.validation('Invalid JSON', { original: e })
);

if (result.isErr()) {
  return errorResponse(result.unwrapErrorOr(AppErrorFactory.internal('')));
}
const data = result.unwrap();
```

### 2. Wrap a Promise

```typescript
const result = await AsyncResult.fromPromise(
  fetch('/api/user'),
  (e) => AppErrorFactory.network('Fetch failed', e)
).run();
```

### 3. Convert null to Option

```typescript
const user = Option.fromNullable(db.findUser(id));
const email = user.map(u => u.email).unwrapOr('unknown@example.com');
```

### 4. Chain async operations

```typescript
const result = await userAdapter
  .findById(id)
  .andThen(user => validateUser(user))
  .andThen(user => enrichUser(user))
  .andThen(user => saveUser(user))
  .run();
```

### 5. Parallel operations (independent)

```typescript
const [user, settings] = await AsyncResult.parallelCombine(
  userAdapter.findById(userId),
  settingsAdapter.findByUserId(userId)
).unwrapOr([null, null]);
```

---

## API Route Template

**Copy this for new routes:**

```typescript
import { NextRequest } from 'next/server';
import { Result, AppError, AppErrorFactory } from '@/lib/fp';
import {
  requireAuth,
  errorResponse,
  successResponse,
  parseJsonBody,
} from '../../lib/route-utils';

export async function POST(request: NextRequest) {
  // Step 1: Authenticate (impure - at edge)
  const userOrResponse = await requireAuth(request);
  if (userOrResponse instanceof Response) return userOrResponse;
  const { id: userId } = userOrResponse;

  // Step 2: Parse and validate request (pure validation)
  const parseResult = await parseJsonBody(request, validateRequest);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppErrorFactory.internal('')));
  }
  const data = parseResult.unwrap();

  // Step 3: Execute business logic (pure composition)
  const result = await YourService.doSomething(userId, data).run();

  // Step 4: Respond (impure - at edge)
  return result.match({
    ok: (value) => successResponse(value),
    err: errorResponse,
  });
}

function validateRequest(body: unknown): Result<AppError, YourType> {
  if (typeof body !== 'object' || body === null) {
    return Result.err(AppErrorFactory.validation('Invalid request body'));
  }
  // ... validation logic
  return Result.ok({ /* validated data */ });
}
```

---

## Error Factory

Create errors with `AppErrorFactory`:

```typescript
AppErrorFactory.validation(message, context?)
AppErrorFactory.notFound(resource, identifier?, context?)
AppErrorFactory.database(message, cause?, context?)
AppErrorFactory.network(message, cause?, context?)
AppErrorFactory.authentication(message, context?)
AppErrorFactory.authorization(message, context?)
AppErrorFactory.rateLimit(message, context?)
AppErrorFactory.serviceUnavailable(service, context?)
AppErrorFactory.internal(message, cause?, context?)
```

**Example:**

```typescript
return Result.err(
  AppErrorFactory.validation('Email is required', { field: 'email' })
);
```

---

## HTTP Status Mapping

Errors automatically map to HTTP status codes:

| Error Kind | HTTP Status |
|------------|-------------|
| `validation` | 400 |
| `not-found` | 404 |
| `authentication` | 401 |
| `authorization` | 403 |
| `rate-limit` | 429 |
| `database`, `internal` | 500 |
| `network`, `service-unavailable` | 503 |

---

## Key Rules

1. **Execute AsyncResult only at edges** (API routes, CLI)
2. **Never throw** in business logic - return `Result.err()` instead
3. **Never import fp-ts** outside `src/lib/fp/`
4. **Use parallelCombine** for independent operations
5. **Handle null** with `Option.fromNullable()`

---

## Cheatsheet

### Option<T>

```typescript
Option.some(value)           // Create Some
Option.none<T>()              // Create None
Option.fromNullable(value)    // From nullable
.map(fn)                      // Transform if Some
.andThen(fn)                  // Chain returning Option
.filter(pred)                 // Keep if predicate matches
.unwrapOr(default)            // Get value or default
.isSome() / .isNone()         // Check
.match({ some, none })        // Pattern match
```

### Result<E, T>

```typescript
Result.ok<E, T>(value)        // Create Ok
Result.err<E, T>(error)       // Create Err
Result.tryCatch(fn, onError)  // Wrap throwing code
.map(fn)                      // Transform success value
.andThen(fn)                  // Chain returning Result
.mapError(fn)                 // Transform error
.unwrapOr(default)            // Get value or default
.match({ ok, err })           // Pattern match
.isOk() / .isErr()            // Check
```

### AsyncResult<E, T>

```typescript
AsyncResult.ok<E, T>(value)                 // Create Ok
AsyncResult.err<E, T>(error)                // Create Err
AsyncResult.fromPromise(promise, onError)  // Wrap Promise
.map(fn)                                     // Transform success value
.andThen(fn)                                 // Chain returning AsyncResult
.andThenPromise(fn, onError)                 // Chain with Promise
.mapError(fn)                                // Transform error
.recoverWith(fn)                             // Recover from errors
.run()                                       // EXECUTE (only at edges!)
.unwrapOr(default)                          // Get value or default (executes)
```

---

## Learning More

- **[fp-ts Rules](./fp-ts-rules.md)** - Core rules
- **[FP Patterns](./fp-patterns.md)** - Detailed patterns with examples
- **[FP Anti-Patterns](./fp-anti-patterns.md)** - Mistakes to avoid
- **[CHORE-005](../specs/CHORE-005-semi-strict-fp-refactor.md)** - Full spec
