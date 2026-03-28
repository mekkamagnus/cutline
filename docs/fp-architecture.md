# FP Architecture Design Document

**Project**: Phraser Semi-Strict Functional Programming Refactor
**Author**: code-architect
**Date**: 2026-02-11
**Status**: Design Phase - Phase 1 Complete, Phases 2-6 Pending

---

## Executive Summary

This document defines the complete architecture for migrating Phraser from imperative to semi-strict functional programming using an fp-ts facade pattern. The architecture emphasizes **pure business logic**, **explicit error handling**, and **clear layer boundaries**.

### Current Status: Phase 3 Complete ✅

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: FP Facade Foundation | ✅ Complete | 100% |
| Phase 2: Database Adapters | ✅ Complete | 100% |
| Phase 3: Service Layer | ✅ Complete | 100% |
| Phase 4: API Route Refactoring | 🔄 In Progress | 0% |
| Phase 5: Migration & Testing | Pending | 0% |
| Phase 6: Documentation | Pending | 0% |

---

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [Layer Architecture](#layer-architecture)
3. [Data Flow](#data-flow)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Component Specifications](#component-specifications)
6. [Testing Strategy](#testing-strategy)
7. [Migration Checkpoints](#migration-checkpoints)
8. [Glossary](#glossary)

---

## Architecture Principles

### Core Tenets

1. **fp-ts is an implementation detail**
   - No fp-ts imports outside `src/lib/fp/`
   - App code uses facade types only: `Option<T>`, `Result<E, T>`, `AsyncResult<E, T>`

2. **Single error domain**
   - All operations use `AppError` type
   - Error kinds: `validation`, `not-found`, `database`, `network`, `authentication`, `authorization`, `rate-limit`, `service-unavailable`, `internal`

3. **Async boundaries are explicit**
   - `AsyncResult.run()` called only at edges (API routes, CLI, workers)
   - Business logic composes `AsyncResult` without executing

4. **Business logic stays pure**
   - No side effects in service methods
   - All I/O at adapter layer

5. **Method-style APIs**
   - Prefer `.map()`, `.andThen()` over pipe combinators
   - Linear flow over nested expressions

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EDGE LAYER                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   API Routes    │  │      CLI        │  │     Workers     │              │
│  │  (route.ts)     │  │  (commands.ts)  │  │  (jobs.ts)      │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
└───────────┼────────────────────┼────────────────────┼────────────────────────┘
            │                    │                    │
            │ executes           │ executes           │ executes
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER (Pure)                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  AuthService    │  │ TranslationSvc  │  │  PhraseService  │              │
│  │  - login()      │  │  - translate()  │  │  - savePhrase() │              │
│  │  - verify()     │  │  - getCache()   │  │  - listPhrases()│              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
└───────────┼────────────────────┼────────────────────┼────────────────────────┘
            │                    │                    │
            │ composes           │ composes           │ composes
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ADAPTER LAYER                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  UserAdapter    │  │ TranslationCache│  │  PhraseAdapter  │              │
│  │  SessionAdapter │  │  Adapter        │  │  SRSAdapter     │              │
│  │  TempPassword   │  │                 │  │                 │              │
│  │  Adapter        │  │                 │  │                 │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
└───────────┼────────────────────┼────────────────────┼────────────────────────┘
            │                    │                    │
            │ converts to        │ converts to        │ converts to
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FP FACADE LAYER                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Option<T>     │  │  Result<E,T>    │  │ AsyncResult<E,T>│              │
│  │   - some()      │  │  - ok()         │  │  - ok()         │              │
│  │   - none()      │  │  - err()        │  │  - err()        │              │
│  │   - map()       │  │  - map()        │  │  - run()        │              │
│  │   - andThen()   │  │  - andThen()    │  │  - andThen()    │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
└───────────┼────────────────────┼────────────────────┼────────────────────────┘
            │                    │                    │
            │ wraps              │ wraps              │ wraps
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL DEPENDENCIES                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Drizzle ORM   │  │  DeepSeek API   │  │   better-sqlite3│              │
│  │   (SQLite)      │  │  (HTTP fetch)   │  │   (Database)    │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Request Flow: `/api/translate` Example

```
1. HTTP Request POST /api/translate
   │
   ├─ Parse JSON body
   │  └─ Result: { phrase, sourceLanguage, targetLanguage } | AppError
   │
2. Edge Layer (route.ts)
   │
   ├─ TranslationService.translate(request)
   │  └─ Returns: AsyncResult<AppError, TranslationResult>
   │
3. Service Layer (pure composition)
   │
   ├─ CacheService.checkInMemory(key)
   │  └─ AsyncResult<AppError, TranslationResult | null>
   │
   ├─ TranslationCacheAdapter.get(key)
   │  └─ AsyncResult<AppError, CachedTranslation | null>
   │
   ├─ PhraseAdapter.findByLanguages(...)
   │  └─ AsyncResult<AppError, Phrase | null>
   │
   ├─ DeepSeekAdapter.translate(...)
   │  └─ AsyncResult<AppError, RawAPIResponse>
   │
   ├─ TranslationParser.parse(response, languages)
   │  └─ Result<AppError, ParsedTranslation>
   │
   ├─ TranslationCacheAdapter.save(parsed)
   │  └─ AsyncResult<AppError, void>
   │
   └─ PhraseAdapter.save(parsed)
   │     └─ AsyncResult<AppError, Phrase>
   │
4. Back to Edge Layer
   │
   ├─ await result.run()
   │  └─ Returns: Result<AppError, TranslationResult>
   │
   ├─ Match on Result:
   │  ├─ Ok(value) → JSON Response 200
   │  └─ Err(error) → Error Response (400/401/403/404/500/503)
   │
5. HTTP Response
```

### Error Flow Example

```
Database Query Fails
   │
   ├─ Adapter catches exception
   │  └─ AsyncResult.fromPromise(query, toAppError)
   │     └─ Converts to AppError.database(...)
   │
   ├─ Service receives AsyncResult
   │  └─ Short-circuits via .andThen()
   │     └─ Remaining steps not executed
   │
   ├─ Edge awaits result.run()
   │  └─ Result: Err(AppError.database(...))
   │
   └─ HTTP Response: 500 Internal Server Error
      └─ Body: { error: kind, message, context }
```

---

## Error Handling Patterns

### AppError to HTTP Status Mapping

| AppError Kind | HTTP Status | Example Scenario |
|---------------|-------------|------------------|
| `validation` | 400 | Missing required fields |
| `not-found` | 404 | Resource doesn't exist |
| `authentication` | 401 | Invalid session |
| `authorization` | 403 | Insufficient permissions |
| `rate-limit` | 429 | Too many requests |
| `network` | 502/503 | External API unreachable |
| `service-unavailable` | 503 | Third-party service down |
| `database` | 500 | Database connection failed |
| `internal` | 500 | Unexpected error |

### Error Creation Patterns

```typescript
// At Adapter Layer - Converting external errors
export class UserAdapter {
  static async findById(id: number): AsyncResult<AppError, User> {
    return AsyncResult.fromPromise(
      db.select().from(users).where(eq(users.id, id)).limit(1),
      (e): AppError => AppError.database(
        `Failed to find user by id: ${id}`,
        e,
        { userId: id }
      )
    ).andThen(rows => {
      if (rows.length === 0) {
        return AsyncResult.err(
          AppError.notFound('User', String(id))
        );
      }
      return AsyncResult.ok(rows[0]);
    });
  }
}

// At Service Layer - Business logic errors
export class AuthService {
  static verifyPassword(code: string, email: string): AsyncResult<AppError, User> {
    // Pure validation logic
    if (!/^\d{6}$/.test(code)) {
      return AsyncResult.err(
        AppError.validation('Invalid code format', { code })
      );
    }

    // Continue with adapter calls...
    return TempPasswordAdapter.findValid(code, email)
      .andThen(tempPassword => {
        if (!tempPassword) {
          return AsyncResult.err(
            AppError.authentication('Invalid or expired code')
          );
        }
        return UserAdapter.findById(tempPassword.userId);
      });
  }
}

// At Edge Layer - Converting Result to HTTP Response
export async function POST(request: NextRequest) {
  const result = await AuthService.verifyPassword(code, email).run();

  return result.match({
    ok: (user) => Response.json({ userId: user.id, email: user.email }),
    err: (error) => {
      const status = ERROR_STATUS_MAP[error.kind] ?? 500;
      return Response.json(
        { error: error.kind, message: error.message },
        { status }
      );
    }
  });
}
```

---

## Component Specifications

### Phase 2: Database Adapters (`src/lib/db/adapters.ts`)

#### UserAdapter

```typescript
export class UserAdapter {
  /**
   * Find user by ID
   * @returns AsyncResult<AppError, User>
   * - Err(not-found) if user doesn't exist
   * - Err(database) if query fails
   */
  static findById(id: number): AsyncResult<AppError, User>;

  /**
   * Find user by email
   * @returns AsyncResult<AppError, User>
   * - Err(not-found) if user doesn't exist
   * - Err(database) if query fails
   */
  static findByEmail(email: string): AsyncResult<AppError, User>;

  /**
   * Create new user
   * @returns AsyncResult<AppError, User>
   * - Err(validation) if email invalid
   * - Err(database) if insert fails
   */
  static create(email: string): AsyncResult<AppError, User>;

  /**
   * Update user's last login timestamp
   * @returns AsyncResult<AppError, void>
   * - Err(not-found) if user doesn't exist
   * - Err(database) if update fails
   */
  static updateLastLogin(userId: number): AsyncResult<AppError, void>;
}
```

#### SessionAdapter

```typescript
export class SessionAdapter {
  /**
   * Create a new session
   * @returns AsyncResult<AppError, Session>
   * - Err(database) if insert fails
   */
  static create(
    userId: number,
    sessionToken: string,
    expiresAt: Date
  ): AsyncResult<AppError, Session>;

  /**
   * Find valid session and include user
   * @returns AsyncResult<AppError, { session: Session; user: User }>
   * - Err(not-found) if session invalid/expired
   * - Err(database) if query fails
   */
  static findValid(
    sessionToken: string,
    now: Date
  ): AsyncResult<AppError, { session: Session; user: User }>;

  /**
   * Delete session by token
   * @returns AsyncResult<AppError, void>
   * - Err(database) if delete fails
   */
  static delete(sessionToken: string): AsyncResult<AppError, void>;

  /**
   * Update session's last used timestamp
   * @returns AsyncResult<AppError, void>
   * - Err(database) if update fails
   */
  static updateLastUsed(sessionId: number): AsyncResult<AppError, void>;

  /**
   * Clean up expired sessions
   * @returns AsyncResult<AppError, number> (count deleted)
   * - Err(database) if delete fails
   */
  static deleteExpired(now: Date): AsyncResult<AppError, number>;
}
```

#### TempPasswordAdapter

```typescript
export class TempPasswordAdapter {
  /**
   * Create a temporary password
   * @returns AsyncResult<AppError, TempPassword>
   * - Err(database) if insert fails
   */
  static create(
    userId: number,
    hashedCode: string,
    expiresAt: Date
  ): AsyncResult<AppError, TempPassword>;

  /**
   * Find valid unused temp password
   * @returns AsyncResult<AppError, TempPassword | null>
   * - Ok(null) if not found (not an error)
   * - Err(database) if query fails
   */
  static findValid(
    userId: number,
    hashedCode: string,
    now: Date
  ): AsyncResult<AppError, TempPassword | null>;

  /**
   * Mark temp password as used
   * @returns AsyncResult<AppError, void>
   * - Err(database) if update fails
   */
  static markAsUsed(
    id: number,
    usedAt: Date
  ): AsyncResult<AppError, void>;

  /**
   * Count recent temp passwords for rate limiting
   * @returns AsyncResult<AppError, number>
   * - Err(database) if query fails
   */
  static countRecent(
    userId: number,
    windowStart: Date
  ): AsyncResult<AppError, number>;

  /**
   * Clean up expired temp passwords
   * @returns AsyncResult<AppError, number> (count deleted)
   * - Err(database) if delete fails
   */
  static deleteExpired(now: Date): AsyncResult<AppError, number>;
}
```

#### PhraseAdapter

```typescript
export class PhraseAdapter {
  /**
   * Find phrase by user and languages
   * @returns AsyncResult<AppError, Phrase | null>
   * - Ok(null) if not found
   * - Err(database) if query fails
   */
  static findByUserAndLanguages(
    userId: number,
    sourcePhrase: string,
    sourceLanguage: string,
    targetLanguage: string
  ): AsyncResult<AppError, Phrase | null>;

  /**
   * Create new phrase
   * @returns AsyncResult<AppError, Phrase>
   * - Err(database) if insert fails
   */
  static create(data: NewPhrase): AsyncResult<AppError, Phrase>;

  /**
   * List all phrases for a user
   * @returns AsyncResult<AppError, Phrase[]>
   * - Err(database) if query fails
   */
  static listByUser(userId: number): AsyncResult<AppError, Phrase[]>;

  /**
   * Update phrase
   * @returns AsyncResult<AppError, Phrase>
   * - Err(not-found) if phrase doesn't exist
   * - Err(database) if update fails
   */
  static update(
    id: number,
    userId: number,
    data: Partial<NewPhrase>
  ): AsyncResult<AppError, Phrase>;

  /**
   * Delete phrase
   * @returns AsyncResult<AppError, void>
   * - Err(not-found) if phrase doesn't exist
   * - Err(database) if delete fails
   */
  static delete(id: number, userId: number): AsyncResult<AppError, void>;
}
```

#### TranslationCacheAdapter

```typescript
export class TranslationCacheAdapter {
  /**
   * Get cached translation
   * @returns AsyncResult<AppError, CachedTranslation | null>
   * - Ok(null) if not found or expired
   * - Err(database) if query fails
   */
  static get(
    sourcePhrase: string,
    sourceLanguage: string,
    targetLanguage: string,
    now: Date
  ): AsyncResult<AppError, CachedTranslation | null>;

  /**
   * Save translation to cache
   * @returns AsyncResult<AppError, CachedTranslation>
   * - Err(database) if insert fails
   */
  static save(
    sourcePhrase: string,
    sourceLanguage: string,
    targetLanguage: string,
    translation: string,
    pronunciations: PronunciationData,
    expiresAt: Date
  ): AsyncResult<AppError, CachedTranslation>;

  /**
   * Delete expired cache entries
   * @returns AsyncResult<AppError, number> (count deleted)
   * - Err(database) if delete fails
   */
  static deleteExpired(now: Date): AsyncResult<AppError, number>;
}
```

#### SRSAdapter (Spaced Repetition System)

```typescript
export class SRSAdapter {
  /**
   * Get SRS data for a phrase
   * @returns AsyncResult<AppError, SRSData | null>
   * - Ok(null) if not found (new card)
   * - Err(database) if query fails
   */
  static findByPhraseId(phraseId: number): AsyncResult<AppError, SRSData | null>;

  /**
   * Create new SRS data for a phrase
   * @returns AsyncResult<AppError, SRSData>
   * - Err(database) if insert fails
   */
  static create(phraseId: number): AsyncResult<AppError, SRSData>;

  /**
   * Update SRS data after review
   * @returns AsyncResult<AppError, SRSData>
   * - Err(not-found) if SRS data doesn't exist
   * - Err(database) if update fails
   */
  static updateReview(
    id: number,
    rating: ReviewRating,
    nextReviewDate: Date,
    easeFactor: number,
    interval: number,
    repetitions: number
  ): AsyncResult<AppError, SRSData>;

  /**
   * Get all due cards for a user
   * @returns AsyncResult<AppError, DueCard[]>
   * - Err(database) if query fails
   */
  static findDueCards(
    userId: number,
    now: Date,
    dailyLimit: number
  ): AsyncResult<AppError, DueCard[]>;

  /**
   * Get review statistics for a user
   * @returns AsyncResult<AppError, ReviewStats>
   * - Err(database) if query fails
   */
  static getReviewStats(
    userId: number,
    startDate: Date,
    endDate: Date
  ): AsyncResult<AppError, ReviewStats>;
}
```

---

### Phase 3: Service Layer

#### AuthService (`src/lib/services/auth-service.ts`)

```typescript
export class AuthService {
  /**
   * Create and send a temporary password for login
   * Business logic:
   * 1. Normalize email
   * 2. Check rate limit (max 3 codes per hour)
   * 3. Generate 6-digit code
   * 4. Hash and store in database
   * 5. Send email (side effect at edge)
   *
   * @returns AsyncResult<AppError, { code: string; email: string }>
   * - Err(validation) if email invalid
   * - Err(rate-limit) if too many attempts
   * - Err(database) if operations fail
   * - Err(network) if email service unavailable
   */
  static createTempPassword(
    email: string,
    now: Date
  ): AsyncResult<AppError, { code: string; email: string }>;

  /**
   * Verify temporary password and create session
   * Business logic:
   * 1. Normalize email
   * 2. Hash code
   * 3. Find valid temp password
   * 4. Mark as used
   * 5. Update user's last login
   * 6. Create session
   *
   * @returns AsyncResult<AppError, { sessionToken: string; user: User }>
   * - Err(validation) if code format invalid
   * - Err(authentication) if code invalid/expired
   * - Err(not-found) if user doesn't exist
   * - Err(database) if operations fail
   */
  static verifyTempPassword(
    code: string,
    email: string,
    now: Date
  ): AsyncResult<AppError, { sessionToken: string; user: User }>;

  /**
   * Verify session and return user
   * @returns AsyncResult<AppError, User>
   * - Err(authentication) if session invalid/expired
   * - Err(not-found) if user doesn't exist
   * - Err(database) if operations fail
   */
  static verifySession(
    sessionToken: string,
    now: Date
  ): AsyncResult<AppError, User>;

  /**
   * Logout by destroying session
   * @returns AsyncResult<AppError, void>
   * - Err(database) if delete fails
   */
  static logout(sessionToken: string): AsyncResult<AppError, void>;

  /**
   * Get authenticated user from request
   * Handles both session cookies and test authentication
   * @returns AsyncResult<AppError, User>
   * - Err(authentication) if not authenticated
   */
  static getAuthenticatedUser(
    request: Request,
    now: Date
  ): AsyncResult<AppError, User>;
}
```

#### TranslationService (`src/lib/services/translation-service.ts`)

```typescript
export class TranslationService {
  /**
   * Translate a phrase with caching
   * Cache hierarchy:
   * 1. In-memory LRU cache (fastest)
   * 2. Database translation cache (7-day TTL)
   * 3. User's saved phrases (persistent)
   * 4. DeepSeek API (external)
   *
   * @returns AsyncResult<AppError, TranslationResult>
   * - Err(validation) if inputs invalid
   * - Err(network) if DeepSeek unreachable
   * - Err(service-unavailable) if DeepSeek down
   * - Err(database) if cache operations fail
   */
  static translate(
    phrase: string,
    sourceLanguage: string,
    targetLanguage: string,
    now: Date
  ): AsyncResult<AppError, TranslationResult>;

  /**
   * Check in-memory cache only
   * @returns AsyncResult<AppError, TranslationResult | null>
   */
  static checkInMemoryCache(
    cacheKey: string
  ): AsyncResult<AppError, TranslationResult | null>;

  /**
   * Check database cache
   * @returns AsyncResult<AppError, CachedTranslation | null>
   */
  static checkDatabaseCache(
    sourcePhrase: string,
    sourceLanguage: string,
    targetLanguage: string,
    now: Date
  ): AsyncResult<AppError, CachedTranslation | null>;

  /**
   * Call DeepSeek API for translation
   * @returns AsyncResult<AppError, RawAPIResponse>
   * - Err(network) if fetch fails
   * - Err(service-unavailable) if API returns error
   * - Err(internal) if response unparseable
   */
  static callDeepSeekAPI(
    phrase: string,
    sourceLanguage: string,
    targetLanguage: string
  ): AsyncResult<AppError, RawAPIResponse>;

  /**
   * Parse API response into structured translation
   * @returns Result<AppError, ParsedTranslation>
   * - Err(validation) if response format invalid
   */
  static parseAPIResponse(
    response: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Result<AppError, ParsedTranslation>;

  /**
   * Save translation to both cache and phrases
   * @returns AsyncResult<AppError, { cached: CachedTranslation; phrase: Phrase }>
   */
  static saveTranslation(
    sourcePhrase: string,
    sourceLanguage: string,
    targetLanguage: string,
    parsed: ParsedTranslation,
    now: Date
  ): AsyncResult<AppError, { cached: CachedTranslation; phrase: Phrase }>;
}
```

#### PhraseService (`src/lib/services/phrase-service.ts`)

```typescript
export class PhraseService {
  /**
   * Save a new phrase for a user
   * @returns AsyncResult<AppError, Phrase>
   * - Err(validation) if input invalid
   * - Err(database) if save fails
   */
  static savePhrase(
    userId: number,
    data: SavePhraseRequest,
    now: Date
  ): AsyncResult<AppError, Phrase>;

  /**
   * List all phrases for a user
   * @returns AsyncResult<AppError, Phrase[]>
   * - Err(database) if query fails
   */
  static listPhrases(
    userId: number,
    filters?: PhraseFilters
  ): AsyncResult<AppError, Phrase[]>;

  /**
   * Get a single phrase by ID
   * @returns AsyncResult<AppError, Phrase>
   * - Err(not-found) if phrase doesn't exist
   * - Err(authorization) if phrase belongs to different user
   * - Err(database) if query fails
   */
  static getPhrase(
    phraseId: number,
    userId: number
  ): AsyncResult<AppError, Phrase>;

  /**
   * Update a phrase
   * @returns AsyncResult<AppError, Phrase>
   * - Err(not-found) if phrase doesn't exist
   * - Err(authorization) if phrase belongs to different user
   * - Err(database) if update fails
   */
  static updatePhrase(
    phraseId: number,
    userId: number,
    data: Partial<SavePhraseRequest>,
    now: Date
  ): AsyncResult<AppError, Phrase>;

  /**
   * Delete a phrase
   * @returns AsyncResult<AppError, void>
   * - Err(not-found) if phrase doesn't exist
   * - Err(authorization) if phrase belongs to different user
   * - Err(database) if delete fails
   */
  static deletePhrase(
    phraseId: number,
    userId: number
  ): AsyncResult<AppError, void>;

  /**
   * Add tags to a phrase
   * @returns AsyncResult<AppError, Tag[]>
   * - Err(not-found) if phrase doesn't exist
   * - Err(database) if operation fails
   */
  static addTags(
    phraseId: number,
    userId: number,
    tagNames: string[]
  ): AsyncResult<AppError, Tag[]>;

  /**
   * Remove tags from a phrase
   * @returns AsyncResult<AppError, void>
   * - Err(database) if operation fails
   */
  static removeTags(
    phraseId: number,
    userId: number,
    tagNames: string[]
  ): AsyncResult<AppError, void>;
}
```

#### ReviewService (`src/lib/services/review-service.ts`)

```typescript
export class ReviewService {
  /**
   * Get cards due for review
   * @returns AsyncResult<AppError, DueCard[]>
   * - Err(database) if query fails
   */
  static getDueCards(
    userId: number,
    now: Date
  ): AsyncResult<AppError, DueCard[]>;

  /**
   * Update card rating and calculate next review date
   * Implements SM-2 algorithm:
   * - Again: reset interval, repetitions = 0
   * - Hard: interval * 1.2, ease factor - 0.1
   * - Good: interval * ease factor, repetitions + 1
   * - Easy: interval * ease factor * 1.3, ease factor + 0.1
   *
   * @returns AsyncResult<AppError, ReviewResult>
   * - Err(not-found) if card doesn't exist
   * - Err(validation) if rating invalid
   * - Err(database) if update fails
   */
  static updateRating(
    phraseId: number,
    userId: number,
    rating: ReviewRating,
    now: Date
  ): AsyncResult<AppError, ReviewResult>;

  /**
   * Get review statistics
   * @returns AsyncResult<AppError, ReviewStats>
   * - Err(database) if query fails
   */
  static getReviewStats(
    userId: number,
    startDate: Date,
    endDate: Date
  ): AsyncResult<AppError, ReviewStats>;
}
```

---

### Phase 4: API Route Pattern

#### Standard Route Template

```typescript
import { NextRequest } from 'next/server';
import { TranslationService } from '@/lib/services/translation-service';
import { AppError } from '@/lib/fp';

// HTTP status code mapping
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

export async function POST(request: NextRequest) {
  // Step 1: Parse and validate request (impure - at edge)
  const parseResult = await parseTranslationRequest(request);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppError.internal('Parse failed')));
  }

  const { phrase, sourceLanguage, targetLanguage } = parseResult.unwrap();

  // Step 2: Execute business logic (pure composition)
  const now = new Date();
  const result = await TranslationService.translate(
    phrase,
    sourceLanguage,
    targetLanguage,
    now
  ).run();

  // Step 3: Convert Result to HTTP response (impure - at edge)
  return result.match({
    ok: (translation) => new Response(
      JSON.stringify(translation),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ),
    err: (error) => {
      const status = ERROR_STATUS_MAP[error.kind] ?? 500;
      return new Response(
        JSON.stringify({ error: error.kind, message: error.message }),
        { status, headers: { 'Content-Type': 'application/json' } }
      );
    },
  });
}

// Helper functions at edge layer

async function parseTranslationRequest(
  request: NextRequest
): Promise<Result<AppError, TranslationRequest>> {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.phrase || typeof body.phrase !== 'string') {
      return Result.err(
        AppError.validation('phrase is required and must be a string')
      );
    }
    if (!body.sourceLanguage || typeof body.sourceLanguage !== 'string') {
      return Result.err(
        AppError.validation('sourceLanguage is required and must be a string')
      );
    }
    if (!body.targetLanguage || typeof body.targetLanguage !== 'string') {
      return Result.err(
        AppError.validation('targetLanguage is required and must be a string')
      );
    }

    return Result.ok({
      phrase: body.phrase,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
    });
  } catch (error) {
    return Result.err(
      AppError.validation('Invalid request body', { original: error })
    );
  }
}

function errorResponse(error: AppError): Response {
  const status = ERROR_STATUS_MAP[error.kind] ?? 500;
  return new Response(
    JSON.stringify({ error: error.kind, message: error.message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
```

---

## Phase 4: API Route Refactoring

### Overview

API routes are the **edge layer** where impure operations happen. They follow a strict three-step pattern:

1. **Parse** request (impure - read body, validate)
2. **Execute** business logic (pure - AsyncResult composition)
3. **Respond** with HTTP response (impure - send response)

### Error to HTTP Status Mapping

| AppError Kind | HTTP Status | Description |
|---------------|-------------|-------------|
| `validation` | 400 | Bad Request - Invalid input |
| `authentication` | 401 | Unauthorized - Not logged in |
| `authorization` | 403 | Forbidden - Insufficient permissions |
| `not-found` | 404 | Not Found - Resource missing |
| `rate-limit` | 429 | Too Many Requests |
| `internal` | 500 | Internal Server Error |
| `database` | 500 | Internal Server Error - Database failed |
| `network` | 503 | Service Unavailable - Network error |
| `service-unavailable` | 503 | Service Unavailable - External API down |

### Standard Route Template

All routes follow this consistent pattern:

```typescript
import { NextRequest } from 'next/server';
import { Result, AsyncResult, AppError } from '@/lib/fp';
import { TranslationService } from '@/lib/services/translation-service';

// ============================================
// ERROR HANDLING
// ============================================

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
} as const;

function errorResponse(error: AppError): Response {
  const status = ERROR_STATUS_MAP[error.kind] ?? 500;
  return new Response(
    JSON.stringify({ error: error.kind, message: error.message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

// ============================================
// REQUEST PARSING (Impure - at edge)
// ============================================

interface TranslationRequest {
  phrase: string;
  sourceLanguage: string;
  targetLanguage: string;
}

async function parseTranslationRequest(
  request: NextRequest
): Promise<Result<AppError, TranslationRequest>> {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.phrase || typeof body.phrase !== 'string') {
      return Result.err(
        AppError.validation('phrase is required and must be a string')
      );
    }
    if (!body.sourceLanguage || typeof body.sourceLanguage !== 'string') {
      return Result.err(
        AppError.validation('sourceLanguage is required')
      );
    }
    if (!body.targetLanguage || typeof body.targetLanguage !== 'string') {
      return Result.err(
        AppError.validation('targetLanguage is required')
      );
    }

    return Result.ok({
      phrase: body.phrase.trim(),
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
    });
  } catch {
    return Result.err(
      AppError.validation('Invalid JSON in request body')
    );
  }
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  // Step 1: Parse and validate request
  const parseResult = await parseTranslationRequest(request);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppError.internal('')));
  }

  const { phrase, sourceLanguage, targetLanguage } = parseResult.unwrap();

  // Step 2: Execute business logic (pure composition)
  const result = await TranslationService.translate(
    phrase,
    sourceLanguage,
    targetLanguage,
    new Date()
  ).run();

  // Step 3: Convert Result to HTTP response
  return result.match({
    ok: (translation) => new Response(
      JSON.stringify(translation),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ),
    err: errorResponse,
  });
}
```

### Route Templates by HTTP Method

#### GET Routes (Read-only)

```typescript
import { NextRequest } from 'next/server';
import { PhraseService } from '@/lib/services/phrase-service';
import { AuthService, AppError } from '@/lib/services/auth-service';
import { Result } from '@/lib/fp';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get authenticated user first
  const authResult = await AuthService.getAuthenticatedUser(
    request,
    new Date()
  ).run();

  if (authResult.isErr()) {
    const error = authResult.unwrapErrorOr(AppError.internal(''));
    const status = error.kind === 'authentication' ? 401 : 500;
    return new Response(
      JSON.stringify({ error: error.kind, message: error.message }),
      { status }
    );
  }

  const user = authResult.unwrap();

  // Parse route params
  const { id } = await params;
  const phraseId = parseInt(id, 10);

  if (isNaN(phraseId)) {
    return new Response(
      JSON.stringify({ error: 'validation', message: 'Invalid phrase ID' }),
      { status: 400 }
    );
  }

  // Execute business logic
  const result = await PhraseService.getPhrase(phraseId, user.id).run();

  return result.match({
    ok: (phrase) => new Response(
      JSON.stringify(phrase),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ),
    err: (error) => {
      const status = ERROR_STATUS_MAP[error.kind] ?? 500;
      return new Response(
        JSON.stringify({ error: error.kind, message: error.message }),
        { status }
      );
    },
  });
}
```

#### POST Routes (Create)

```typescript
import { NextRequest } from 'next/server';
import { PhraseService, AppError } from '@/lib/services/phrase-service';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest) {
  // Authenticate
  const authResult = await AuthService.getAuthenticatedUser(request, new Date()).run();
  if (authResult.isErr()) {
    return errorResponse(authResult.unwrapErrorOr(AppError.internal('')));
  }
  const user = authResult.unwrap();

  // Parse request
  const parseResult = await parseSavePhraseRequest(request);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppError.internal('')));
  }
  const data = parseResult.unwrap();

  // Execute
  const result = await PhraseService.savePhrase(user.id, data, new Date()).run();

  return result.match({
    ok: (phrase) => new Response(
      JSON.stringify(phrase),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    ),
    err: errorResponse,
  });
}

async function parseSavePhraseRequest(
  request: NextRequest
): Promise<Result<AppError, SavePhraseRequest>> {
  // Similar validation pattern...
}
```

#### PUT Routes (Update)

```typescript
import { NextRequest } from 'next/server';
import { PhraseService, AppError } from '@/lib/services/phrase-service';
import { AuthService } from '@/lib/services/auth-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate
  const authResult = await AuthService.getAuthenticatedUser(request, new Date()).run();
  if (authResult.isErr()) {
    return errorResponse(authResult.unwrapErrorOr(AppError.internal('')));
  }
  const user = authResult.unwrap();

  // Parse params and body
  const { id } = await params;
  const phraseId = parseInt(id, 10);

  if (isNaN(phraseId)) {
    return new Response(
      JSON.stringify({ error: 'validation', message: 'Invalid phrase ID' }),
      { status: 400 }
    );
  }

  const parseResult = await parseSavePhraseRequest(request);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppError.internal('')));
  }
  const data = parseResult.unwrap();

  // Execute
  const result = await PhraseService.updatePhrase(
    phraseId,
    user.id,
    data,
    new Date()
  ).run();

  return result.match({
    ok: (phrase) => new Response(
      JSON.stringify(phrase),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ),
    err: errorResponse,
  });
}
```

#### DELETE Routes

```typescript
import { NextRequest } from 'next/server';
import { PhraseService, AppError } from '@/lib/services/phrase-service';
import { AuthService } from '@/lib/services/auth-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate
  const authResult = await AuthService.getAuthenticatedUser(request, new Date()).run();
  if (authResult.isErr()) {
    return errorResponse(authResult.unwrapErrorOr(AppError.internal('')));
  }
  const user = authResult.unwrap();

  // Parse params
  const { id } = await params;
  const phraseId = parseInt(id, 10);

  if (isNaN(phraseId)) {
    return new Response(
      JSON.stringify({ error: 'validation', message: 'Invalid phrase ID' }),
      { status: 400 }
    );
  }

  // Execute
  const result = await PhraseService.deletePhrase(phraseId, user.id).run();

  return result.match({
    ok: () => new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ),
    err: errorResponse,
  });
}
```

### Refactoring Priority Order

Routes are refactored in order of increasing risk:

#### Tier 1: Read-Only Routes (Safest First)

**`/api/phrases/list`**
- GET only
- Lists user's phrases
- No mutations
- Safe to refactor first

**`/api/stats/review`**
- GET only
- Aggregates data
- No mutations
- Low risk

#### Tier 2: Write Routes (Medium Risk)

**`/api/phrases` (POST)**
- Creates new phrases
- Moderate risk - data creation
- Has existing tests

**`/api/phrases/[id]` (PUT, DELETE)**
- Updates and deletes
- Moderate risk - data modification
- Authorization check required

#### Tier 3: Complex Routes (Higher Risk)

**`/api/translate` (POST)**
- Most complex endpoint (412 lines)
- Multi-level caching
- External API calls
- High value but high risk

**`/api/review/update-rating` (POST)**
- SRS algorithm
- Updates card state
- Complex business logic

#### Tier 4: Authentication Routes (Critical - Last)

**`/api/auth/send-temp-password` (POST)**
**`/api/auth/verify-temp-password` (POST)**
**`/api/auth/logout` (POST)**

- Security-critical
- Session management
- Email delivery
- Refactor LAST after verifying other routes

### Helper Module: Route Utilities

Create `src/app/api/lib/route-utils.ts` for shared route helpers:

```typescript
import { NextRequest } from 'next/server';
import { AppError, Result, AsyncResult } from '@/lib/fp';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AuthenticatedRequest extends NextRequest {
  user: { id: number; email: string };
}

// ============================================
// ERROR RESPONSES
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

export function errorResponse(error: AppError): Response {
  const status = ERROR_STATUS_MAP[error.kind] ?? 500;
  return new Response(
    JSON.stringify({ error: error.kind, message: error.message }),
    { status, headers: { 'Content-Type': 'application/json' } }
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

import { AuthService } from '@/lib/services/auth-service';

export async function withAuth(
  request: NextRequest
): Promise<Result<AppError, { id: number; email: string }>> {
  return (await AuthService.getAuthenticatedUser(request, new Date()).run())
    .match({
      ok: (user) => Result.ok<AppError, { id: user.id, email: user.email }),
      err: (error) => Result.err(error),
    });
}

export async function requireAuth(
  request: NextRequest
): Promise<{ id: number; email: string } | Response> {
  const result = await AuthService.getAuthenticatedUser(request, new Date()).run();

  if (result.isErr()) {
    const error = result.unwrapErrorOr(AppError.internal(''));
    const status = error.kind === 'authentication' ? 401 : 500;
    return new Response(
      JSON.stringify({ error: error.kind, message: error.message }),
      { status }
    );
  }

  return result.unwrap();
}

// ============================================
// PARAMETER PARSING
// ============================================

export function parseIdParam(idParam: string): Result<AppError, number> {
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    return Result.err(
      AppError.validation('Invalid ID parameter', { received: idParam })
    );
  }
  return Result.ok(id);
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
```

### Example: Refactored Route Using Helpers

```typescript
import { NextRequest } from 'next/server';
import { PhraseService, AppError } from '@/lib/services/phrase-service';
import { Result } from '@/lib/fp';
import {
  requireAuth,
  errorResponse,
  successResponse,
  parseIdParam,
  parseJsonBody,
} from '../lib/route-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate (impure)
  const userOrResponse = await requireAuth(request);
  if (userOrResponse instanceof Response) {
    return userOrResponse; // Auth failed, return error response
  }
  const { id: userId } = userOrResponse;

  // Parse params (pure validation)
  const { id } = await params;
  const idResult = parseIdParam(id);
  if (idResult.isErr()) {
    return errorResponse(idResult.unwrapErrorOr(AppError.internal('')));
  }
  const phraseId = idResult.unwrap();

  // Execute business logic (pure)
  const result = await PhraseService.getPhrase(phraseId, userId).run();

  // Respond (impure)
  return result.match({
    ok: (phrase) => successResponse(phrase),
    err: errorResponse,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userOrResponse = await requireAuth(request);
  if (userOrResponse instanceof Response) {
    return userOrResponse;
  }
  const { id: userId } = userOrResponse;

  const { id } = await params;
  const idResult = parseIdParam(id);
  if (idResult.isErr()) {
    return errorResponse(idResult.unwrapErrorOr(AppError.internal('')));
  }
  const phraseId = idResult.unwrap();

  // Parse and validate body
  const parseResult = await parseJsonBody(request, validateSavePhraseRequest);
  if (parseResult.isErr()) {
    return errorResponse(parseResult.unwrapErrorOr(AppError.internal('')));
  }

  // Execute
  const result = await PhraseService.updatePhrase(
    phraseId,
    userId,
    parseResult.unwrap(),
    new Date()
  ).run();

  return result.match({
    ok: (phrase) => successResponse(phrase),
    err: errorResponse,
  });
}

function validateSavePhraseRequest(body: unknown): Result<AppError, SavePhraseRequest> {
  // Validation logic...
  return Result.ok(body as SavePhraseRequest);
}
```

### Error Response Format

All error responses follow this consistent format:

```json
{
  "error": "validation",
  "message": "phrase is required and must be a string"
}
```

Success responses:

```json
{
  "id": 123,
  "translation": "Konnichiwa",
  "sourcePhrase": "Hello",
  ...
}
```

### Testing Refactored Routes

```typescript
describe('/api/phrases/[id]', () => {
  describe('GET', () => {
    it('should return 401 without authentication', async () => {
      const response = await fetch('http://localhost:3500/api/phrases/123');
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('authentication');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await fetch(
        'http://localhost:3500/api/phrases/invalid',
        { headers: { 'x-test-auth': process.env.TEST_AUTH_TOKEN } }
      );
      expect(response.status).toBe(400);
    });

    it('should return phrase for valid request', async () => {
      const response = await fetch(
        'http://localhost:3500/api/phrases/1',
        { headers: { 'x-test-auth': process.env.TEST_AUTH_TOKEN } }
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('translation');
    });

    it('should return 404 for non-existent phrase', async () => {
      const response = await fetch(
        'http://localhost:3500/api/phrases/999999',
        { headers: { 'x-test-auth': process.env.TEST_AUTH_TOKEN } }
      );
      expect(response.status).toBe(404);
    });
  });
});
```

---

## Testing Strategy

### Layer-by-Layer Testing

#### FP Facade Tests (`src/lib/fp/__tests__/`)

**Goal**: ≥95% coverage with property-based tests

```typescript
// Example: Option tests
describe('Option', () => {
  describe('laws', () => {
    it('should satisfy map identity law', () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const option = Option.some(value);
        const mapped = option.map(x => x);
        return mapped.equals(option);
      }));
    });

    it('should satisfy map composition law', () => {
      fc.assert(fc.property(
        fc.integer(),
        fc.func(fc.integer()),
        fc.func(fc.integer()),
        (value, f, g) => {
          const composed = Option.some(value).map(x => g(f(x)));
          const separate = Option.some(value).map(f).map(g);
          return composed.equals(separate);
        }
      ));
    });
  });
});
```

**Commands**:
```bash
npx vitest run src/lib/fp/__tests__/ --coverage
```

#### Adapter Tests (`src/lib/db/__tests__/adapters.test.ts`)

**Goal**: ≥90% coverage with real database

**Key Points**:
- Use real SQLite database (no mocks)
- Clean up test data in `afterEach`
- Use unique test data to avoid conflicts
- Test both success and error paths

```typescript
describe('UserAdapter', () => {
  let testDb: Database;
  let userId: number;

  beforeEach(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase(testDb);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const result = await UserAdapter.findById(userId).run();
      expect(result.isOk()).toBe(true);
      expect(result.unwrapOr(null)?.email).toBe('test@example.com');
    });

    it('should return not-found error when user does not exist', async () => {
      const result = await UserAdapter.findById(99999).run();
      expect(result.isErr()).toBe(true);
      const error = result.unwrapErrorOr(AppError.internal(''));
      expect(error.kind).toBe('not-found');
    });
  });
});
```

**Commands**:
```bash
npx vitest run src/lib/db/__tests__/adapters.test.ts --coverage
```

#### Service Tests (`src/lib/services/__tests__/`)

**Goal**: ≥95% coverage with pure function tests

**Key Points**:
- Services are pure, easy to test
- Mock adapters at service level (optional - can use real adapters)
- Test business logic edge cases

```typescript
describe('AuthService', () => {
  describe('createTempPassword', () => {
    it('should create temp password for new user', async () => {
      const result = await AuthService.createTempPassword(
        'new@example.com',
        new Date()
      ).run();

      expect(result.isOk()).toBe(true);
      const { code, email } = result.unwrapOr({ code: '', email: '' });
      expect(code).toMatch(/^\d{6}$/);
      expect(email).toBe('new@example.com');
    });

    it('should enforce rate limit', async () => {
      const email = 'ratelimit@example.com';
      const now = new Date();

      // Create 3 temp passwords (at limit)
      for (let i = 0; i < 3; i++) {
        await AuthService.createTempPassword(email, now).run();
      }

      // 4th should fail
      const result = await AuthService.createTempPassword(email, now).run();
      expect(result.isErr()).toBe(true);
      const error = result.unwrapErrorOr(AppError.internal(''));
      expect(error.kind).toBe('rate-limit');
    });
  });
});
```

**Commands**:
```bash
npx vitest run src/lib/services/__tests__/ --coverage
```

#### API Route Tests (`src/app/api/**/__tests__/`)

**Goal**: ≥80% coverage with integration tests

```typescript
describe('/api/translate', () => {
  it('should return translation for valid request', async () => {
    const response = await fetch('http://localhost:3500/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phrase: 'hello',
        sourceLanguage: 'English',
        targetLanguage: 'Japanese',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.translation).toBeTruthy();
  });

  it('should return 400 for missing fields', async () => {
    const response = await fetch('http://localhost:3500/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phrase: 'hello' }), // Missing languages
    });

    expect(response.status).toBe(400);
  });
});
```

---

## Migration Checkpoints

### Checkpoint 1: FP Facade ✅ Complete

**Validation**:
- [x] `Option<T>` implements all required methods
- [x] `Result<E, T>` implements all required methods
- [x] `AsyncResult<E, T>` implements all required methods
- [x] `AppError` domain type defined with 9 error kinds
- [x] All facade tests pass
- [x] No fp-ts imports outside `src/lib/fp/`
- [x] TypeScript compilation succeeds

**Files Created**:
- `src/lib/fp/option.ts`
- `src/lib/fp/result.ts`
- `src/lib/fp/async-result.ts`
- `src/lib/fp/errors.ts`
- `src/lib/fp/index.ts`
- `src/lib/fp/__tests__/option.test.ts`
- `src/lib/fp/__tests__/result.test.ts`
- `src/lib/fp/__tests__/async-result.test.ts`
- `src/lib/fp/__tests__/errors.test.ts`

### Checkpoint 2: Database Adapters ✅ Complete

**Validation**:
- [x] All adapter methods return `AsyncResult<AppError, T>`
- [x] Adapter tests pass with real database
- [x] No Drizzle imports outside adapter layer
- [x] Error conversion to AppError is complete

**Files Created**:
- `src/lib/db/adapters.ts`
- `src/lib/db/__tests__/adapters.test.ts`

**Acceptance Tests**:
```bash
npx vitest run src/lib/db/__tests__/adapters.test.ts
```

### Checkpoint 3: Service Layer ✅ Complete

**Validation**:
- [x] All service methods return `AsyncResult<AppError, T>`
- [x] Services have zero side effects
- [x] Service tests pass (≥90% coverage achieved)
- [x] Services use adapters, not Drizzle directly

**Files Created**:
- `src/lib/services/auth-service.ts`
- `src/lib/services/translation-service.ts`
- `src/lib/services/phrase-service.ts`
- `src/lib/services/review-service.ts`
- `src/lib/services/__tests__/*.test.ts`

**Acceptance Tests**:
```bash
npx vitest run src/lib/services/__tests__/ --coverage
```

### Checkpoint 4: API Routes 🔄 In Progress

**Validation**:
- [ ] Route follows standard pattern (parse → execute → respond)
- [ ] Error responses use AppError → HTTP mapping
- [ ] No regressions in functionality
- [ ] Existing tests still pass

**Migration Order**:
1. ✅ Read-only endpoints (safest)
   - ✅ `/api/phrases/list`
   - ✅ `/api/stats/review`

2. 🔄 Write endpoints
   - [ ] `/api/phrases` (POST)
   - [ ] `/api/phrases/[id]` (PUT, DELETE)

3. ⏳ Complex endpoints
   - [ ] `/api/translate` (POST)
   - [ ] `/api/review/update-rating` (POST)

4. ⏳ Authentication endpoints (critical - last)
   - [ ] `/api/auth/send-temp-password`
   - [ ] `/api/auth/verify-temp-password`
   - [ ] `/api/auth/logout`

**Files to Create**:
- `src/app/api/lib/route-utils.ts` - Shared route helpers
- Update individual route files with FP pattern

**Acceptance Tests**:
```bash
npx vitest run src/app/api/**/__tests__/
curl -X POST http://localhost:3500/api/translate -d '{...}'
```

### Checkpoint 5: Documentation

**Validation**:
- [ ] Pattern documentation created
- [ ] Anti-pattern documentation created
- [ ] FP-ts-rules updated with examples
- [ ] Migration checklist is actionable

**Files to Create**:
- `docs/fp-patterns.md`
- `docs/fp-anti-patterns.md`
- `MIGRATION_CHECKLIST.md`

---

## Glossary

| Term | Definition |
|------|------------|
| **Facade** | A wrapper around fp-ts that hides implementation details from app code |
| **AsyncResult** | A lazy async computation that can fail. Only executed at edges via `.run()` |
| **AppError** | Single error domain type used across all operations |
| **Adapter** | Boundary layer that converts external I/O to FP types |
| **Service** | Pure business logic that composes AsyncResult operations |
| **Edge** | System boundaries where side effects occur (API routes, CLI, workers) |
| **Pure** | Functions with no side effects; same input always produces same output |
| **Impure** | Functions with side effects (I/O, database, network) |
| **Method-style API** | Chaining methods like `.map().andThen()` instead of `pipe()` combinators |
| **Semi-strict FP** | Functional programming with pragmatic concessions (method chaining, not Haskell-pure) |

---

## Appendix: Quick Reference

### Import Patterns

```typescript
// ✅ CORRECT - Import from facade
import { Option, Result, AsyncResult, AppError } from '@/lib/fp';

// ❌ WRONG - Direct fp-ts imports
import { Option, Either } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
```

### Common Patterns

```typescript
// Convert nullable to Option
const maybeUser = Option.fromNullable(db.findUser(id));

// Option to Result
const userResult = maybeUser.match({
  some: (u) => Result.ok<AppError, User>(u),
  none: () => Result.err(AppError.notFound('User', id)),
});

// Try/catch to Result
const parsed = Result.tryCatch(
  () => JSON.parse(input),
  (e) => AppError.validation('Invalid JSON', { original: e })
);

// Promise to AsyncResult
const fetched = AsyncResult.fromPromise(
  fetch(url),
  (e) => AppError.network('Fetch failed', e)
);

// Chain operations
const result = await UserAdapter.findById(userId)
  .andThen(user => PhraseAdapter.listByUser(user.id))
  .andThen(phrases => AsyncResult.ok(phrases.filter(p => p.isActive)))
  .run();
```

---

**Document Version**: 1.0
**Last Updated**: 2026-02-11
**Next Review**: After Phase 2 completion
