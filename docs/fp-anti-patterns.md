# FP Anti-Patterns - Common Mistakes to Avoid

This document contains anti-patterns to avoid when using the Phraser FP facade. Each anti-pattern shows the wrong way and the correct way, with examples.

## Table of Contents

- [Don't: Execute AsyncResult in Business Logic](#dont-execute-asyncresult-in-business-logic)
- [Don't: Throw Exceptions in Business Logic](#dont-throw-exceptions-in-business-logic)
- [Don't: Mix null with Option/Result](#dont-mix-null-with-optionresult)
- [Don't: Import fp-ts Outside Facade](#dont-import-fp-ts-outside-facade)
- [Don't: Use Combinators (pipe) in App Code](#dont-use-combinators-pipe-in-app-code)
- [Don't: Use unwrap/unwrap() Without Checking](#dont-use-unwrapunwrap-without-checking)
- [Don't: Nest andThen Calls](#dont-nest-andthen-calls)
- [Don't: Create Async Result Just to Await It](#dont-create-async-result-just-to-await-it)
- [Don't: Mix Authentication with Business Logic](#dont-mix-authentication-with-business-logic)
- [Don't: Use combine() for Independent Operations](#dont-use-combine-for-independent-operations)

---

## Don't: Execute AsyncResult in Business Logic

### ❌ Wrong: Calling run() in service/business logic

```typescript
// ❌ WRONG - Executing in service layer
class UserService {
  async processUser(id: string): Promise<User> {
    const result = await this.userAdapter.findById(id).run();
    // Business logic mixed with execution - violates separation!
    if (result.isErr()) {
      throw new Error(result.unwrapErrorOr(null).message);
    }
    const user = result.unwrapOr(null);
    return user;
  }
}
```

**Why it's wrong:**
- Business logic should stay pure and composable
- Execution should only happen at edges (API routes, CLI, workers)
- Makes testing harder (need to mock execution)
- Loses the ability to compose with other AsyncResult operations

### ✅ Right: Return AsyncResult, execute at edge

```typescript
// ✅ RIGHT - Return AsyncResult from service
class UserService {
  processUser(id: string): AsyncResult<AppError, User> {
    return this.userAdapter
      .findById(id)
      .andThen(user => this.validate(user))
      .andThen(user => this.enrich(user));
  }

  private validate(user: User): AsyncResult<AppError, User> {
    // Pure validation logic
    return user.email
      ? AsyncResult.ok(user)
      : AsyncResult.err(AppError.validation('Email required'));
  }
}

// ✅ RIGHT - Execute at edge (API route)
app.get('/users/:id', async (req, res) => {
  const result = await userService.processUser(req.params.id).run();
  // Handle result for HTTP response
});
```

**From the facade:**
> "IMPORTANT: AsyncResult.run() should only be called at system edges (API routes, CLI, workers). Business logic should compose AsyncResult chains without executing them."
> — `src/lib/fp/async-result.ts`

---

## Don't: Throw Exceptions in Business Logic

### ❌ Wrong: Throwing in service methods

```typescript
// ❌ WRONG - Throwing in business logic
class UserService {
  getUser(id: string): AsyncResult<AppError, User> {
    if (!id || id.length === 0) {
      throw new Error('Invalid ID'); // ❌ Throwing!
    }
    return this.userAdapter.findById(id);
  }
}
```

**Why it's wrong:**
- Breaks the Result type - callers can't handle errors in the type system
- Defeats the purpose of using Result/AsyncResult for error handling
- Forces try/catch at call sites instead of using .andThen or .mapError

### ✅ Right: Return AsyncResult.err for errors

```typescript
// ✅ RIGHT - Return error AsyncResult
class UserService {
  getUser(id: string): AsyncResult<AppError, User> {
    if (!id || id.length === 0) {
      return AsyncResult.err(
        AppError.validation('Invalid ID', { id })
      );
    }
    return this.userAdapter.findById(id);
  }
}
```

### ✅ Right: Use Result.tryCatch for throwing code

```typescript
// ✅ RIGHT - Wrap throwing code in tryCatch
class UserService {
  parseUserId(input: string): Result<AppError, number> {
    return Result.tryCatch(
      () => parseInt(input),
      (e) => AppError.validation('Invalid user ID format', e)
    );
  }
}
```

---

## Don't: Mix null with Option/Result

### ❌ Wrong: Returning null alongside Option

```typescript
// ❌ WRONG - Mixing null with Option
function findUser(id: string): Option<User> | null {
  const user = db.findUser(id);
  if (!user) return null; // ❌ Why use Option then?
  return Option.some(user);
}

// ❌ WRONG - Returning null from map
const email = Option.fromNullable(user)
  .map(u => u.email) // This could be null/undefined!
  .unwrapOr(null);  // ❌ Now we're back to null land
```

**Why it's wrong:**
- Defeats the purpose of Option (explicit nullability)
- Creates confusion about whether null is possible
- Callers still need null checks

### ✅ Right: Always return Option, use fromNullable consistently

```typescript
// ✅ RIGHT - Consistent Option usage
function findUser(id: string): Option<User> {
  return Option.fromNullable(db.findUser(id));
}

// ✅ RIGHT - Chain Option for nested nullable values
const email = Option.fromNullable(user)
  .andThen(u => Option.fromNullable(u.email))
  .unwrapOr('unknown@example.com');

// ✅ RIGHT - Convert Option to Result for error cases
const userResult = fromOption(
  Option.fromNullable(db.findUser(id)),
  () => AppError.notFound('User', id)
);
```

---

## Don't: Import fp-ts Outside Facade

### ❌ Wrong: Direct fp-ts imports in app code

```typescript
// ❌ WRONG - App code importing fp-ts directly
import { Option, some, none } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';

const result = pipe(
  getValue(),
  O.map(x => x * 2),
  O.chain(x => x > 10 ? some(x) : none)
);
```

**Why it's wrong:**
- fp-ts is an internal implementation detail
- Tight coupling to fp-ts API changes
- Harder to read for developers unfamiliar with fp-ts
- Violates the facade pattern

### ✅ Right: Import only from facade

```typescript
// ✅ RIGHT - Import from facade only
import { Option, Result } from '@/lib/fp';

const result = Option.fromNullable(getValue())
  .map(x => x * 2)
  .andThen(x => x > 10 ? Option.some(x) : Option.none<number>());
```

**From fp-ts-rules.md:**
> "App code must never import fp-ts. fp-ts is an internal implementation detail, not a dependency of business logic."

---

## Don't: Use Combinators (pipe) in App Code

### ❌ Wrong: Using pipe and fp-ts combinators

```typescript
// ❌ WRONG - Using pipe in app code
import { pipe } from 'fp-ts/lib/function';

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
```

**Why it's wrong:**
- Hard to read and scan (nested structure)
- Difficult to debug
- Not idiomatic JavaScript/TypeScript
- Goes against the facade's method-style API

### ✅ Right: Use method chaining (andThen, map)

```typescript
// ✅ RIGHT - Linear, method-style
const result = await getUser(id)
  .andThen(user => validateUser(user))
  .andThen(validated => saveUser(validated))
  .andThen(saved => sendEmail(saved))
  .run();
```

**From fp-ts-rules.md:**
> "Prefer method-style or linear APIs over combinators. Optimize for readability and scan-ability, not theoretical minimalism."

---

## Don't: Use unwrap/unwrap() Without Checking

### ❌ Wrong: Calling unwrap() without checking

```typescript
// ❌ WRONG - unwrap() can throw
function getUserEmail(id: string): string {
  const user = userAdapter.findById(id).run().unwrap(); // ❌ Throws if Err!
  return user.email;
}

// ❌ WRONG - unwrapOr without checking type
const email = userOption.map(u => u.email).unwrapOr(null);
// email could still be null if u.email was null!
```

**Why it's wrong:**
- `unwrap()` throws on error - defeats type safety
- `unwrapOr()` doesn't protect against nested nulls
- Defeats the purpose of using Result/Option

### ✅ Right: Use match or check first

```typescript
// ✅ RIGHT - Use match for explicit handling
const result = await userAdapter.findById(id).run();
return result.match({
  ok: (user) => user.email,
  err: (error) => {
    // Handle error appropriately
    logger.error('Failed to get user', error);
    return 'unknown@example.com';
  }
});

// ✅ RIGHT - Chain for nested nulls
const email = userOption
  .andThen(u => Option.fromNullable(u.email))
  .unwrapOr('unknown@example.com');
```

---

## Don't: Nest andThen Calls

### ❌ Wrong: Nested andThen

```typescript
// ❌ WRONG - Nested andThen
const result = userAdapter.findById(id)
  .andThen(user => {
    return settingsAdapter.findByUserId(user.id)
      .andThen(settings => {
        return profileAdapter.findByUserId(user.id)
          .andThen(profile => {
            // Deep nesting!
            return AsyncResult.ok({ user, settings, profile });
          });
      });
  });
```

**Why it's wrong:**
- Pyramid of doom
- Hard to read
- Difficult to add/remove steps

### ✅ Right: Use combine or parallelCombine

```typescript
// ✅ RIGHT - Parallel combine for independent operations
const result = userAdapter.findById(id)
  .andThen(user => {
    return AsyncResult.parallelCombine(
      settingsAdapter.findByUserId(user.id),
      profileAdapter.findByUserId(user.id)
    ).map(([settings, profile]) => ({
      user,
      settings,
      profile
    }));
  });

// ✅ RIGHT - Or use flat chaining with intermediate variables
const result = userAdapter
  .findById(id)
  .andThen(user => {
    const settings = settingsAdapter.findByUserId(user.id);
    const profile = profileAdapter.findByUserId(user.id);
    return AsyncResult.parallelCombine(settings, profile)
      .map(([s, p]) => ({ user, settings: s, profile: p }));
  });
```

---

## Don't: Create Async Result Just to Await It

### ❌ Wrong: Unnecessary AsyncResult wrapper

```typescript
// ❌ WRONG - Creating AsyncResult just to await immediately
class UserService {
  async getUserEmail(id: string): Promise<string> {
    const result = await this.userAdapter.findById(id).run();
    return result.map(u => u.email).unwrapOr('');
  }
}
```

**Why it's wrong:**
- If you're just going to unwrap immediately, you might not need AsyncResult
- Adds complexity without benefit in simple cases

### ✅ Right: Use AsyncResult throughout, or plain Promise for simple cases

```typescript
// ✅ RIGHT - Return AsyncResult for composition
class UserService {
  getUserEmail(id: string): AsyncResult<AppError, string> {
    return this.userAdapter
      .findById(id)
      .map(user => user.email);
  }
}

// Or if truly simple and doesn't need error handling:
// ✅ RIGHT - Plain Promise for simple cases
class UserService {
  async getUserEmailUnsafe(id: string): Promise<string> {
    const user = await db.findUser(id);
    return user?.email ?? '';
  }
}
```

---

## Summary of Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Execute AsyncResult in business logic | Return AsyncResult, execute at edge |
| Throw exceptions in business logic | Return Result.err or use tryCatch |
| Mix null with Option/Result | Use fromNullable consistently, chain for nested nulls |
| Import fp-ts in app code | Import only from @/lib/fp facade |
| Use pipe/combinators | Use method chaining (map, andThen) |
| unwrap() without checking | Use match or check isOk()/isSome() first |
| Nest andThen calls | Use combine/parallelCombine or flat chain |
| Create AsyncResult just to await | Return AsyncResult for composition or use plain Promise |

---

## Quick Reference: Correct vs Incorrect

### AsyncResult Execution

```typescript
// ❌ Wrong
async process(id: string): Promise<User> {
  return await this.find(id).run().unwrap();
}

// ✅ Right
process(id: string): AsyncResult<AppError, User> {
  return this.find(id).andThen(u => this.validate(u));
}
```

### Error Handling

```typescript
// ❌ Wrong
if (!user) throw new Error('Not found');

// ✅ Right
if (!user) return AsyncResult.err(AppError.notFound('User'));
```

### Nullable Handling

```typescript
// ❌ Wrong
return user ?? null;

// ✅ Right
return Option.fromNullable(user);
```

### Imports

```typescript
// ❌ Wrong
import { pipe } from 'fp-ts/lib/function';

// ✅ Right
import { Result, AsyncResult } from '@/lib/fp';
```

---

## Don't: Mix Authentication with Business Logic

### ❌ Wrong: Authentication checks inside service methods

```typescript
// ❌ WRONG - Authentication mixed with business logic
class PhraseService {
  async updatePhrase(id: number, data: PhraseData, userId: number): Promise<Phrase> {
    // ❌ Checking ownership inside service - mixing concerns!
    const phrase = await db.findPhrase(id);
    if (!phrase || phrase.userId !== userId) {
      throw new Error('Unauthorized');
    }
    return db.updatePhrase(id, data);
  }
}
```

**Why it's wrong:**
- Authentication/authorization is an edge concern, not business logic
- Service should be pure and composable
- Hard to test service without mocking auth
- Violates single responsibility principle

### ✅ Right: Handle authentication at edge, pass data to service

```typescript
// ✅ RIGHT - Service only handles business logic
class PhraseService {
  updatePhrase(id: number, data: PhraseData): AsyncResult<AppError, Phrase> {
    return phraseAdapter.update(id, data);
  }
}

// ✅ RIGHT - Route handles auth and ownership check
export async function PUT(request: NextRequest) {
  // Step 1: Authenticate at edge
  const userOrResponse = await requireAuth(request);
  if (userOrResponse instanceof Response) return userOrResponse;
  const { id: userId } = userOrResponse;

  // Step 2: Parse params
  const idResult = parseIdParam(params.id);
  if (idResult.isErr()) return errorResponse(idResult.unwrapErrorOr(...));
  const phraseId = idResult.unwrap();

  // Step 3: Verify ownership at edge (before calling service)
  const ownershipResult = await verifyPhraseOwnership(phraseId, userId).run();
  if (ownershipResult.isErr()) return errorResponse(ownershipResult.unwrapErrorOr(...));

  // Step 4: Execute business logic
  const parseResult = await parseJsonBody(request, validateUpdateRequest);
  if (parseResult.isErr()) return errorResponse(parseResult.unwrapErrorOr(...));
  const data = parseResult.unwrap();

  // Step 5: Call pure service
  const result = await phraseService.updatePhrase(phraseId, data).run();

  // Step 6: Respond
  return result.match({
    ok: (phrase) => successResponse(phrase),
    err: errorResponse,
  });
}
```

---

## Don't: Use combine() for Independent Operations

### ❌ Wrong: Using combine() when operations are independent

```typescript
// ❌ WRONG - Sequential execution of independent operations (slow!)
const [user, settings] = await userAdapter
  .findById(userId)
  .combine(settingsAdapter.findByUserId(userId))  // Waits for user first!
  .unwrapOr([null, null]);
```

**Why it's wrong:**
- `combine()` runs operations **sequentially**, not in parallel
- Second operation waits for first to complete
- For I/O operations (DB queries, API calls), this is ~2x slower than parallel
- Defeats the purpose of having `parallelCombine()` available

### ✅ Right: Use parallelCombine() for independent operations

```typescript
// ✅ RIGHT - Parallel execution of independent operations (fast!)
const [user, settings] = await AsyncResult.parallelCombine(
  userAdapter.findById(userId),
  settingsAdapter.findByUserId(userId)
).unwrapOr([null, null]);

// ✅ RIGHT - Use combine() when second depends on first
const userWithSettings = await userAdapter
  .findById(userId)
  .andThen(user => settingsAdapter.findByUserId(user.id))  // Needs user.id
  .map(settings => ({ user, settings }))
  .unwrapOr(null);
```

**Performance comparison:**
- Sequential (`combine()`): 200ms + 200ms = **400ms total**
- Parallel (`parallelCombine()`): **max(200ms, 200ms) = 200ms total**

---

## Related Documentation

- [fp-ts Rules](./fp-ts-rules.md) - Core rules for the FP facade
- [FP Patterns](./fp-patterns.md) - Correct patterns to use
- [CHORE-005](../specs/CHORE-005-semi-strict-fp-refactor.md) - Refactoring specification
