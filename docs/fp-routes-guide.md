# API Route Refactoring Guide - Phase 4

**Phase**: FP Refactor Phase 4 - API Route Refactoring
**Author**: code-architect
**Date**: 2026-02-11
**Status**: Design Complete

---

## Overview

API routes are the **edge layer** - the only place where `AsyncResult.run()` should be called. All routes follow a consistent three-step pattern.

---

## The Three-Step Pattern

Every API route follows this structure:

```typescript
export async function POST(request: NextRequest) {
  // Step 1: Parse and validate (impure)
  const parseResult = await parseRequest(request);
  if (parseResult.isErr()) return errorResponse(parseResult.unwrapErrorOr(...));

  // Step 2: Execute business logic (pure - AsyncResult)
  const result = await SomeService.doSomething(data).run();

  // Step 3: Convert to HTTP response (impure)
  return result.match({
    ok: (value) => successResponse(value),
    err: errorResponse,
  });
}
```

### Why This Pattern?

| Step | Concern | Pure/Impure |
|------|----------|--------------|
| 1. Parse | Read request body, validate input | **Impure** (I/O) |
| 2. Execute | Business logic, database calls | **Pure** (AsyncResult) |
| 3. Respond | Send HTTP response | **Impure** (I/O) |

**Key**: Only Step 2 is pure business logic. Steps 1 and 3 are "edge code" that must exist for the API to function.

---

## Error to HTTP Status Mapping

```typescript
const ERROR_STATUS_MAP: Record<AppErrorKind, number> = {
  validation: 400,        // Bad Request
  authentication: 401,    // Unauthorized
  authorization: 403,     // Forbidden
  'not-found': 404,       // Not Found
  'rate-limit': 429,      // Too Many Requests
  internal: 500,          // Internal Server Error
  database: 500,          // Internal Server Error
  network: 503,           // Service Unavailable
  'service-unavailable': 503, // Service Unavailable
} as const;
```

---

## Complete Route Examples

### Example 1: GET Route (Read-Only)

**File**: `src/app/api/phrases/list/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { PhraseService, AuthService } from '@/lib/services';
import { AppError } from '@/lib/fp';

const ERROR_STATUS_MAP: Record<AppErrorKind, number> = {
  validation: 400,
  'not-found': 404,
  database: 500,
  network: 503,
  authentication: 401,
  authorization: 403,
  'rate-limit': 429,
  'service-unavailable': 503,
  internal: 500,
};

function errorResponse(error: AppError): Response {
  const status = ERROR_STATUS_MAP[error.kind] ?? 500;
  return new Response(
    JSON.stringify({ error: error.kind, message: error.message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

function successResponse(data: unknown): Response {
  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function GET(request: NextRequest) {
  // Step 1: Authenticate (impure)
  const authResult = await AuthService.getAuthenticatedUser(
    request,
    new Date()
  ).run();

  if (authResult.isErr()) {
    return errorResponse(authResult.unwrapErrorOr(AppError.internal('')));
  }
  const user = authResult.unwrap();

  // Step 2: Get phrases (pure business logic)
  const result = await PhraseService.listPhrases(user.id).run();

  // Step 3: Respond (impure)
  return result.match({
    ok: (phrases) => successResponse(phrases),
    err: errorResponse,
  });
}
```

### Example 2: POST Route (Create)

**File**: `src/app/api/phrases/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { PhraseService, AuthService } from '@/lib/services';
import { Result, AppError } from '@/lib/fp';

// ... errorResponse and successResponse helpers ...

interface SavePhraseRequest {
  sourcePhrase: string;
  translation: string;
  sourceLanguage: string;
  targetLanguage: string;
}

async function parseSavePhraseRequest(
  request: NextRequest
): Promise<Result<AppError, SavePhraseRequest>> {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.sourcePhrase?.trim()) {
      return Result.err(AppError.validation('sourcePhrase is required'));
    }
    if (!body.translation?.trim()) {
      return Result.err(AppError.validation('translation is required'));
    }
    if (!body.sourceLanguage?.trim()) {
      return Result.err(AppError.validation('sourceLanguage is required'));
    }
    if (!body.targetLanguage?.trim()) {
      return Result.err(AppError.validation('targetLanguage is required'));
    }

    return Result.ok({
      sourcePhrase: body.sourcePhrase.trim(),
      translation: body.translation.trim(),
      sourceLanguage: body.sourceLanguage.trim(),
      targetLanguage: body.targetLanguage.trim(),
    });
  } catch {
    return Result.err(AppError.validation('Invalid JSON body'));
  }
}

export async function POST(request: NextRequest) {
  // Step 1: Authenticate and parse
  const authResult = await AuthService.getAuthenticatedUser(request, new Date()).run();
  if (authResult.isErr()) {
    return errorResponse(authResult.unwrapErrorOr(AppError.internal('')));
  }
  const user = authResult.unwrap();

  const parseResult = await parseSavePhraseRequest(request);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppError.internal('')));
  }
  const data = parseResult.unwrap();

  // Step 2: Create phrase
  const result = await PhraseService.savePhrase(user.id, data, new Date()).run();

  // Step 3: Respond
  return result.match({
    ok: (phrase) => new Response(
      JSON.stringify(phrase),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    ),
    err: errorResponse,
  });
}
```

### Example 3: PUT Route (Update)

**File**: `src/app/api/phrases/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { PhraseService, AuthService } from '@/lib/services';
import { Result, AppError } from '@/lib/fp';

// ... helpers ...

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Step 1: Authenticate, parse params and body
  const authResult = await AuthService.getAuthenticatedUser(request, new Date()).run();
  if (authResult.isErr()) {
    return errorResponse(authResult.unwrapErrorOr(AppError.internal('')));
  }
  const user = authResult.unwrap();

  const { id } = await params;
  const idResult = Result.tryCatch(
    () => parseInt(id, 10),
    () => AppError.validation('Invalid phrase ID')
  );
  if (idResult.isErr()) {
    return errorResponse(idResult.unwrapErrorOr(AppError.internal('')));
  }
  const phraseId = idResult.unwrap();

  const parseResult = await parseSavePhraseRequest(request);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppError.internal('')));
  }
  const data = parseResult.unwrap();

  // Step 2: Update phrase
  const result = await PhraseService.updatePhrase(
    phraseId,
    user.id,
    data,
    new Date()
  ).run();

  // Step 3: Respond
  return result.match({
    ok: (phrase) => successResponse(phrase),
    err: errorResponse,
  });
}
```

### Example 4: DELETE Route

```typescript
import { NextRequest } from 'next/server';
import { PhraseService, AuthService } from '@/lib/services';
import { Result, AppError } from '@/lib/fp';

// ... helpers ...

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Step 1: Authenticate and parse params
  const authResult = await AuthService.getAuthenticatedUser(request, new Date()).run();
  if (authResult.isErr()) {
    return errorResponse(authResult.unwrapErrorOr(AppError.internal('')));
  }
  const user = authResult.unwrap();

  const { id } = await params;
  const idResult = Result.tryCatch(
    () => parseInt(id, 10),
    () => AppError.validation('Invalid phrase ID')
  );
  if (idResult.isErr()) {
    return errorResponse(idResult.unwrapErrorOr(AppError.internal('')));
  }
  const phraseId = idResult.unwrap();

  // Step 2: Delete phrase
  const result = await PhraseService.deletePhrase(phraseId, user.id).run();

  // Step 3: Respond
  return result.match({
    ok: () => new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ),
    err: errorResponse,
  });
}
```

---

## Shared Route Utilities

Create `src/app/api/lib/route-utils.ts` to avoid code duplication:

```typescript
import { NextRequest } from 'next/server';
import { AppError, Result, AsyncResult } from '@/lib/fp';
import { AuthService } from '@/lib/services';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AuthenticatedUser {
  id: number;
  email: string;
}

// ============================================
// CONSTANTS
// ============================================

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

// ============================================
// RESPONSE HELPERS
// ============================================

export function errorResponse(error: AppError, status?: number): Response {
  const actualStatus = status ?? ERROR_STATUS_MAP[error.kind] ?? 500;
  return new Response(
    JSON.stringify({ error: error.kind, message: error.message }),
    { status: actualStatus, headers: { 'Content-Type': 'application/json' } }
  );
}

export function successResponse(data: unknown, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Authenticate the request and return the user.
 * Returns a Response if authentication fails (for early return).
 * Returns the user if successful.
 */
export async function withAuth(
  request: NextRequest
): Promise<AsyncResult<AppError, AuthenticatedUser>> {
  return AuthService.getAuthenticatedUser(request, new Date());
}

/**
 * Parse an ID parameter and validate it's a number.
 */
export function parseIdParam(idParam: string): Result<AppError, number> {
  return Result.tryCatch(
    () => parseInt(idParam, 10),
    () => AppError.validation('Invalid ID parameter', { received: idParam })
  ).andThen(id => {
    if (isNaN(id) || id <= 0) {
      return Result.err(AppError.validation('Invalid ID parameter', { received: idParam }));
    }
    return Result.ok(id);
  });
}

// ============================================
// REQUEST BODY PARSING
// ============================================

export async function parseJsonBody<T>(
  request: NextRequest,
  validator: (body: unknown) => Result<AppError, T>
): Promise<Result<AppError, T>> {
  try {
    const body = await request.json();
    return validator(body);
  } catch {
    return Result.err(AppError.validation('Invalid JSON body'));
  }
}

/**
 * Validate a non-empty string field
 */
export function validateStringField(
  value: unknown,
  fieldName: string
): Result<AppError, string> {
  if (typeof value !== 'string') {
    return Result.err(AppError.validation(`${fieldName} must be a string`));
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return Result.err(AppError.validation(`${fieldName} is required`));
  }
  return Result.ok(trimmed);
}
```

---

## Route Refactoring Checklist

For each route to refactor:

### Before Refactoring

1. [ ] Read the existing route implementation
2. [ ] Identify the service methods that will be called
3. [ ] Note any side effects that need to stay at edge
4. [ ] Check existing tests for expected behavior

### During Refactoring

1. [ ] Add authentication (if required)
2. [ ] Create parse function for request body
3. [ ] Replace business logic with service call
4. [ ] Convert Result to HTTP response using `.match()`
5. [ ] Ensure error responses use correct status codes

### After Refactoring

1. [ ] Run existing tests - they should still pass
2. [ ] Manually test the endpoint
3. [ ] Check error cases (400, 401, 404, 500)
4. [ ] Verify no regressions in functionality

---

## Common Patterns

### Pattern 1: Simple GET with Auth

```typescript
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request).run();
  if (authResult.isErr()) {
    return errorResponse(authResult.unwrapErrorOr(AppError.internal('')));
  }
  const { id: userId } = authResult.unwrap();

  const result = await SomeService.list(userId).run();
  return result.match({
    ok: successResponse,
    err: errorResponse,
  });
}
```

### Pattern 2: POST with Body Parsing

```typescript
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request).run();
  if (authResult.isErr()) {
    return errorResponse(authResult.unwrapErrorOr(AppError.internal('')));
  }

  const parseResult = await parseJsonBody(request, validateBody);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppError.internal('')));
  }

  const result = await SomeService.create(parseResult.unwrap()).run();
  return result.match({
    ok: (data) => successResponse(data, 201),
    err: errorResponse,
  });
}
```

### Pattern 3: Route with ID Parameter

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth(request).run();
  if (authResult.isErr()) {
    return errorResponse(authResult.unwrapErrorOr(AppError.internal('')));
  }

  const { id } = await params;
  const idResult = parseIdParam(id);
  if (idResult.isErr()) {
    return errorResponse(idResult.unwrapErrorOr(AppError.internal('')));
  }
  const entityId = idResult.unwrap();

  const parseResult = await parseJsonBody(request, validateBody);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppError.internal('')));
  }

  const result = await SomeService.update(entityId, parseResult.unwrap()).run();
  return result.match({
    ok: successResponse,
    err: errorResponse,
  });
}
```

---

## Testing Refactored Routes

```typescript
describe('/api/phrases', () => {
  describe('POST', () => {
    it('should return 401 without auth', async () => {
      const response = await fetch('http://localhost:3500/api/phrases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePhrase: 'Hello',
          translation: 'Hola',
          sourceLanguage: 'English',
          targetLanguage: 'Spanish',
        }),
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('authentication');
    });

    it('should return 400 for missing fields', async () => {
      const response = await fetch('http://localhost:3500/api/phrases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-auth': process.env.TEST_AUTH_TOKEN,
        },
        body: JSON.stringify({
          sourcePhrase: 'Hello',
          // Missing translation, sourceLanguage, targetLanguage
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('validation');
    });

    it('should create phrase and return 201', async () => {
      const response = await fetch('http://localhost:3500/api/phrases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-auth': process.env.TEST_AUTH_TOKEN,
        },
        body: JSON.stringify({
          sourcePhrase: 'Hello',
          translation: 'Hola',
          sourceLanguage: 'English',
          targetLanguage: 'Spanish',
        }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body.sourcePhrase).toBe('Hello');
      expect(body.translation).toBe('Hola');
    });
  });
});
```

---

## Migration Priority

### Tier 1: Read-Only (Start Here)
1. `/api/phrases/list` - Simple GET with auth
2. `/api/stats/review` - Aggregation, no mutations

### Tier 2: Write Operations
3. `/api/phrases` (POST) - Create
4. `/api/phrases/[id]` (PUT, DELETE) - Update/Delete

### Tier 3: Complex Operations
5. `/api/review/update-rating` - SRS algorithm
6. `/api/translate` - Complex caching, external API

### Tier 4: Authentication (Do Last)
7. `/api/auth/send-temp-password`
8. `/api/auth/verify-temp-password`
9. `/api/auth/logout`

---

## Quick Reference

| HTTP Method | Use Case | Pattern |
|--------------|----------|----------|
| GET | Read data | Auth → Service → Response |
| POST | Create | Auth → Parse → Service → Response |
| PUT | Update | Auth → Parse ID + Body → Service → Response |
| DELETE | Delete | Auth → Parse ID → Service → Response |

| Error Kind | Status | When to Use |
|------------|--------|-------------|
| validation | 400 | Invalid input |
| authentication | 401 | Not logged in |
| authorization | 403 | No permission |
| not-found | 404 | Resource missing |
| rate-limit | 429 | Too many requests |
| internal/database | 500 | Server error |
| network/service-unavailable | 503 | External failure |

---

## Related Documentation

- [FP Architecture](./fp-architecture.md) - Complete system design
- [FP Patterns](./fp-patterns.md) - AsyncResult composition patterns
- [Service Layer Guidance](./fp-service-layer-guidance.md) - Business logic design
