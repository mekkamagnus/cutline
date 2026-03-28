## fp-ts behind a facade — Rules

### 1. App code must never import fp-ts

fp-ts is an internal implementation detail, not a dependency of business logic.

```typescript
// ❌ WRONG - Direct fp-ts imports in app code
import { Option, some, none } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';

// ✅ RIGHT - Import from facade only
import { Option, result, asyncResult, AppError } from '@/lib/fp';

// Example from the codebase: src/lib/fp/index.ts
// Only the facade imports fp-ts internally:
import * as O from 'fp-ts/lib/Option';  // ✅ OK - facade only
import * as E from 'fp-ts/lib/Either';  // ✅ OK - facade only
import * as TE from 'fp-ts/lib/TaskEither';  // ✅ OK - facade only

// Application code imports:
import { Option, Result, AsyncResult } from '@/lib/fp';  // ✅ OK
```

**Real example from the Phraser codebase:**

```typescript
// src/lib/fp/result.ts - Facade implementation (internal)
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

export class Result<E, T> {
  private constructor(private readonly value: E.Either<E, T>) {}

  static ok<E, T>(value: T): Result<E, T> {
    return new Result(E.right(value));
  }

  // ... rest of implementation hidden from app code
}
```

---

## Quick Validation

You can verify fp-ts is not imported outside the facade:

```bash
# Should return nothing (no fp-ts imports outside facade)
! grep -r "from 'fp-ts" src/ --exclude="src/lib/fp/"
! grep -r "from \"fp-ts" src/ --exclude="src/lib/fp/"
```

---

### 2. Expose only a small, blessed set of FP types

Typically Option<T>, Result<E, T>, and AsyncResult<E, T>—nothing more by default.

```typescript
// ❌ WRONG - Exposing many fp-ts types
export { Option, Either, Task, TaskEither, Reader, IO, State, These } from 'fp-ts';

// ✅ RIGHT - Small, focused facade (from src/lib/fp/index.ts)
export { Option } from './option';
export { Result, fromOption_ as fromOption } from './result';
export { AsyncResult } from './async-result';

// Error types
export type { AppError, AppErrorKind } from './errors';
export { AppError } from './errors';

// Business code uses only these
import { Option, Result, AsyncResult, AppError } from '@/lib/fp';
```

**Real example from the Phraser codebase:**

```typescript
// src/lib/fp/index.ts - The public API
// Types
export { Option } from './option';
export { Result, fromOption_ as fromOption } from './result';
export { AsyncResult } from './async-result';

// Error types
export type { AppError, AppErrorKind } from './errors';
export { AppError } from './errors';

// Convenience constructors
export const result = {
  ok: <E, T>(value: T) => Result.ok<E, T>(value),
  err: <E, T>(error: E) => Result.err<E, T>(error),
  tryCatch: <E, T>(fn: () => T, onError: (error: unknown) => E) =>
    Result.tryCatch(fn, onError),
};

export const asyncResult = {
  ok: <E, T>(value: T) => AsyncResult.ok<E, T>(value),
  err: <E, T>(error: E) => AsyncResult.err<E, T>(error),
  fromPromise: <E, T>(promise: Promise<T>, onError: (error: unknown) => E) =>
    AsyncResult.fromPromise(promise, onError),
};
```

---

### 3. All failures use a single domain error type

Standardize on AppError across sync and async code.

```typescript
// ❌ WRONG - Inconsistent error types
function getUser(id: string): Either<string, Error, User> { }
function saveUser(u: User): Either<ValidationError, DatabaseError, void> { }

// ✅ RIGHT - Single domain error type (from src/lib/fp/errors.ts)
interface AppError {
  kind: AppErrorKind;
  message: string;
  context?: Record<string, unknown>;
}

type AppErrorKind =
  | 'validation'
  | 'not-found'
  | 'database'
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'rate-limit'
  | 'service-unavailable'
  | 'internal';

function getUser(id: string): AsyncResult<AppError, User> { }
function saveUser(u: User): AsyncResult<AppError, void> { }
```

**Real example from the Phraser codebase:**

```typescript
// src/lib/fp/errors.ts - AppError domain type
export const AppError = {
  validation: (message: string, context?: Record<string, unknown>): AppError => ({
    kind: 'validation',
    message,
    context,
  }),

  notFound: (resource: string, identifier?: string): AppError => ({
    kind: 'not-found',
    message: identifier ? `${resource} not found: ${identifier}` : `${resource} not found`,
  }),

  database: (message: string, cause?: unknown): AppError => ({
    kind: 'database',
    message,
    context: cause ? { cause: String(cause) } : undefined,
  }),

  network: (message: string, cause?: unknown): AppError => ({
    kind: 'network',
    message,
  }),

  // ... 9 total error kinds
};

// Usage in code
const result = Result.tryCatch(
  () => JSON.parse(input),
  (e) => AppError.validation('Invalid JSON', { original: e })
);
```

---

### 4. Prefer method-style or linear APIs over combinators

Optimize for readability and scan-ability, not theoretical minimalism.

```typescript
// ❌ WRONG - Nested combinators, hard to read
const result = pipe(
  getUser(id),
  O.map(user => pipe(
    validateUser(user),
    E.map(validated => pipe(
      saveUser(validated),
      E.map(saved => sendEmail(saved))
    ))
  ))
);

// ✅ RIGHT - Linear, method-style
const result = await getUser(id)
  .andThen(user => validateUser(user))
  .andThen(validated => saveUser(validated))
  .andThen(saved => sendEmail(saved))
  .run();
```

**Real example from the Phraser codebase:**

```typescript
// src/lib/fp/result.ts - Method-style API
export class Result<E, T> {
  // Transform the success value
  map<U>(fn: (value: T) => U): Result<E, U> { /* ... */ }

  // Chain together operations that may return Result
  andThen<U>(fn: (value: T) => Result<E, U>): Result<E, U> { /* ... */ }

  // Transform the error value
  mapError<F>(fn: (error: E) => F): Result<F, T> { /* ... */ }

  // Get the value or return a default
  unwrapOr(defaultValue: T): T { /* ... */ }

  // Pattern matching
  match<R>(patterns: { ok: (value: T) => R; err: (error: E) => R }): R { /* ... */ }
}

// Usage example (from CHORE-005 specification)
class UserService {
  processUser(id: string): AsyncResult<AppError, User> {
    return this.userAdapter
      .findById(id)
      .andThen(user => this.validate(user))
      .andThen(user => this.enrich(user))
      .andThen(user => this.save(user));
  }
}
```

---

### 5. Hide pipe, namespaces, and typeclasses

These belong inside the facade, never in application files.

```typescript
// ❌ WRONG - App code using fp-ts patterns
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { Functor } from 'fp-ts/lib/Functor';

const result = pipe(
  value,
  E.map(x => x * 2),
  E.chain(y => E.of(y + 1))
);

// ✅ RIGHT - Clean facade methods
const result = Result.ok(value)
  .map(x => x * 2)
  .andThen(y => Result.ok(y + 1));
```

**Real example from the Phraser codebase:**

```typescript
// src/lib/fp/result.ts - Internal pipe usage (hidden)
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

export class Result<E, T> {
  private constructor(private readonly value: E.Either<E, T>) {}

  map<U>(fn: (value: T) => U): Result<E, U> {
    // pipe is used internally, but app code never sees it
    return new Result(pipe(this.value, E.map(fn)));
  }

  andThen<U>(fn: (value: T) => Result<E, U>): Result<E, U> {
    return new Result(pipe(this.value, E.chain((v) => fn(v).value)));
  }
}

// App code sees only method chaining:
const result = Result.ok<AppError, number>(5)
  .map(x => x * 2)
  .andThen(x => Result.ok(x + 1));
```

---

### 6. Async boundaries are explicit

AsyncResult is only executed (await/run) at system edges (HTTP, CLI, workers).

```typescript
// ❌ WRONG - Executing async in business logic
class UserService {
  async processUser(id: string): Promise<void> {
    const result = await this.getUser(id).run();
    // Business logic mixed with execution
  }
}

// ✅ RIGHT - Execution at edges only
class UserService {
  processUser(id: string): AsyncResult<AppError, User> {
    return this.getUser(id)
      .andThen(user => this.validate(user))
      .andThen(user => this.save(user));
  }
}

// Edge: HTTP controller
app.get('/users/:id', async (req, res) => {
  const result = await userService.processUser(req.params.id).run();
  // Handle result for HTTP response
});
```

**Real example from the Phraser codebase:**

```typescript
// src/lib/fp/async-result.ts - Execution only at edges
export class AsyncResult<E, T> {
  /**
   * EXECUTE the async computation - ONLY at edges!
   * Returns a Result<E, T> that can be inspected
   */
  async run(): Promise<Result<E, T>> {
    const either = await this.value();
    return new Result(either);
  }

  // Convenience methods for edges (still execute)
  async unwrapOr(defaultValue: T): Promise<T> {
    const result = await this.run();
    return result.unwrapOr(defaultValue);
  }
}
```

**Example edge pattern (from CHORE-005):**

```typescript
// API route handler - the edge where AsyncResult is executed
export async function POST(request: NextRequest) {
  // 1. Parse and validate request (edge: impure)
  const parseResult = await parseRequest(request);
  if (parseResult.isErr()) return errorResponse(parseResult.unwrapOr(null));

  // 2. Execute business logic (pure composition)
  const result = await Service.doSomething(parseResult.unwrapOr(null)).run();

  // 3. Convert Result to HTTP response (edge: impure)
  if (result.isErr()) return errorResponse(result.unwrapOr(null));
  return successResponse(result.unwrapOr(null));
}
```

---

### 7. Business logic stays pure

No side effects outside constructors and boundary adapters.

```typescript
// ❌ WRONG - Side effects in business logic
class UserService {
  calculateBonus(user: User): number {
    console.log('Calculating bonus'); // Side effect!
    fs.appendFileSync('log.txt', 'bonus calculated'); // Side effect!
    return user.salary * 0.1;
  }
}

// ✅ RIGHT - Pure business logic
class UserService {
  calculateBonus(user: User): number {
    return user.salary * 0.1; // Pure function
  }
}

// Side effects at boundary
class UserLogger {
  logBonusCalculation(user: User, bonus: number): void {
    console.log(`Bonus: ${bonus}`);
  }
}
```

---

### 8. Conversions happen at the edges

Translate from Promise, null, exceptions, and external errors into FP types immediately.

```typescript
// ❌ WRONG - Leakage of null/exceptions/Promise
function fetchUser(id: string): User | null {
  try {
    return db.findUser(id);
  } catch (e) {
    throw new UserNotFoundError(e);
  }
}

// ✅ RIGHT - Immediate conversion at edges
class UserRepository {
  // Edge adapter - converts to FP type immediately
  findById(id: string): Result<AppError, User> {
    return Result.tryCatch(
      () => {
        const user = db.findUser(id);
        if (!user) throw new Error('Not found');
        return user;
      },
      (e): AppError => ({
        kind: 'not-found',
        message: String(e)
      })
    );
  }

  async findByIdAsync(id: string): AsyncResult<AppError, User> {
    return AsyncResult.fromPromise(
      db.findUserAsync(id),
      (e): AppError => ({
        kind: 'database',
        message: String(e)
      })
    );
  }
}
```

---

### 9. No custom abstractions without proven need

If you're about to invent typeclasses, pause and reconsider.

```typescript
// ❌ WRONG - Premature abstraction
interface Functor<F> {
  map<A, B>(f: (a: A) => B): (fa: HKT<F, A>) => HKT<F, B>;
}

interface Monad<F> extends Functor<F> {
  chain<A, B>(f: (a: A) => HKT<F, B>): (ma: HKT<F, A>) => HKT<F, B>;
}

// Just use Option and Result directly!

// ✅ RIGHT - Simple, concrete types
class Option<T> {
  map<U>(fn: (value: T) => U): Option<U> { /* ... */ }
  andThen<U>(fn: (value: T) => Option<U>): Option<U> { /* ... */ }
}

// Add methods only when actually needed
class Result<E, T> {
  map<U>(fn: (value: T) => U): Result<E, U> { /* ... */ }
  // Only add recoverWith if you have repeated use cases
}
```

---

### 10. One canonical way to do common things

Mapping, chaining, error handling, and unwrapping must be consistent across the codebase.

```typescript
// ❌ WRONG - Multiple ways to do the same thing
option.map(f);
option.flatMap(f);          // vs
option.andThen(f);          // vs
option.chain(f);

result.unwrap();
result.getOrElse(default);  // vs
result.match({ ok, err });

// ✅ RIGHT - Single canonical approach
option.map(fn);             // Always map for transformation
option.andThen(fn);         // Always andThen for chaining
option.unwrapOr(default);   // Always unwrapOr for extraction

// Same for Result
result.map(fn);
result.andThen(fn);
result.mapError(fn);        // Always mapError for error transformation
result.unwrapOr(default);
```

---

### 11. Ergonomics beats completeness

Prefer fewer helpers that are easy to understand over a large, "complete" API.

```typescript
// ❌ WRONG - Exhaustive but overwhelming
class Option<T> {
  map, ap, flatten, chain, chainFirst, filter, filterMap,
  fold, getOrElse, match, matchE, fromPredicate,
  getMonoid, getOrd, getEq, getShow, // ... 30+ methods
}

// ✅ RIGHT - Focused, understandable API
class Option<T> {
  static some<T>(value: T): Option<T>
  static none<T>(): Option<T>

  map<U>(fn: (value: T) => U): Option<U>
  andThen<U>(fn: (value: T) => Option<U>): Option<U>
  unwrapOr(defaultValue: T): T
  isSome(): boolean
  isNone(): boolean
}
// That's it! Add more only when genuinely needed.
```

---

### 12. The facade is allowed to change; app code is not

You may refactor or replace fp-ts internally without touching business logic.

```typescript
// ✅ RIGHT - Business code stable through facade changes
// src/services/user.ts - Never needs to change
export class UserService {
  processUser(id: string): Result<AppError, User> {
    return this.repo
      .findById(id)
      .andThen(user => this.validate(user))
      .map(user => this.enrich(user));
  }
}

// lib/fp/result.ts - Free to refactor
// Version 1: Using fp-ts internally
import * as E from 'fp-ts/lib/Either';
export class Result<E, T> {
  constructor(private readonly inner: E.Either<E, T>) {}
}

// Version 2: Replaced with custom implementation (no fp-ts!)
export class Result<E, T> {
  private readonly tag: 'ok' | 'err';
  constructor(
    private readonly value?: T,
    private readonly error?: E
  ) {}
  // App code still works unchanged!
}
```

---

## How to Migrate Existing Code

### Step 1: Identify Async Operations

Find functions that return Promise and may fail:

```typescript
// Before - existing code
async function getUser(id: string): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id)
  });
  return user;
}
```

### Step 2: Convert to AsyncResult

Wrap the Promise in AsyncResult and handle null:

```typescript
// After - FP pattern
function getUser(id: string): AsyncResult<AppError, User> {
  return AsyncResult.fromPromise(
    db.query.users.findFirst({ where: eq(users.id, id) }),
    (e) => AppError.database('Failed to fetch user', e)
  ).andThen(user => {
    if (!user) {
      return AsyncResult.err(AppError.notFound('User', id));
    }
    return AsyncResult.ok(user);
  });
}
```

### Step 3: Update Call Sites

Convert the call site to execute at the edge:

```typescript
// Before - in API route
export async function GET(request: NextRequest) {
  const user = await getUser(id);
  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ user });
}

// After - execute at edge
export async function GET(request: NextRequest) {
  const result = await getUser(id).run();

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
    case 'not-found': return 404;
    case 'validation': return 400;
    case 'database': return 500;
    // ... map all error kinds
  }
}
```

### Step 4: Extract Business Logic

Move pure business logic to service methods:

```typescript
// Before - logic mixed in route
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Validation logic mixed with I/O
  if (!body.email || !body.email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }
  const user = await createUser(body.email);
  return NextResponse.json({ user });
}

// After - separate service
class UserService {
  createUser(email: string): AsyncResult<AppError, User> {
    return this.validateEmail(email)
      .andThen(() => this.userAdapter.create(email));
  }

  private validateEmail(email: string): AsyncResult<AppError, string> {
    if (!email || !email.includes('@')) {
      return AsyncResult.err(AppError.validation('Invalid email format'));
    }
    return AsyncResult.ok(email);
  }
}

// Route becomes thin
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await userService.createUser(body.email).run();
  // ... handle result
}
```

### Migration Checklist

For each function to migrate:

- [ ] Identify return type (Promise → AsyncResult, nullable → Option)
- [ ] Wrap external calls in fromPromise/fromNullable/tryCatch
- [ ] Convert null/undefined returns to errors
- [ ] Update call sites to execute at edges
- [ ] Add error kind mapping for HTTP responses
- [ ] Write tests (no mocks, use real DB/API)
- [ ] Verify existing tests still pass

### Common Conversions

| Before | After |
|--------|-------|
| `Promise<T \| null>` | `AsyncResult<AppError, T>` |
| `T \| null \| undefined` | `Option<T>` |
| `try { ... } catch { throw }` | `Result.tryCatch(...)` |
| `if (!x) throw e` | `if (!x) return Result.err(...)` |
| `await fetch()` | `AsyncResult.fromPromise(fetch(), ...)` |
| `x.map(fn)` (array) | Keep as-is (not Option) |

---

## Related Documentation

- [FP Patterns](./fp-patterns.md) - Common patterns with examples
- [FP Anti-Patterns](./fp-anti-patterns.md) - Mistakes to avoid
- [CHORE-005](../specs/CHORE-005-semi-strict-fp-refactor.md) - Full migration specification

