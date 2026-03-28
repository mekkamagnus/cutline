# Service Layer Implementation Guidance

**Phase**: FP Refactor Phase 3 - Service Layer
**Author**: code-architect
**Date**: 2026-02-11

---

## Overview

Services contain **pure business logic** that composes AsyncResult operations from adapters. Services have no side effects - all I/O happens at the adapter layer.

---

## Core Principles

### 1. Pure Functions

All service methods return `AsyncResult<AppError, T>` and never execute directly:

```typescript
// ✅ RIGHT - Pure composition
class UserService {
  getUser(id: number): AsyncResult<AppError, User> {
    return UserAdapter.findById(id)
      .andThen(user => this.validate(user));
  }
}

// ❌ WRONG - Impure (executes in service)
class UserService {
  async getUser(id: number): Promise<User> {
    const result = await UserAdapter.findById(id).run(); // ❌
    return result.unwrap();
  }
}
```

### 2. Single Responsibility

Each service handles one domain:
- `AuthService` - Authentication and sessions
- `TranslationService` - Translation and caching
- `PhraseService` - Phrase CRUD
- `ReviewService` - SRS algorithm and card scheduling

### 3. Error Handling at Boundaries

Services return errors, they don't throw:

```typescript
// ✅ RIGHT - Return error AsyncResult
class AuthService {
  verifyCode(code: string): AsyncResult<AppError, User> {
    if (!/^\d{6}$/.test(code)) {
      return AsyncResult.err(
        AppError.validation('Invalid code format')
      );
    }
    return TempPasswordAdapter.findValid(code);
  }
}

// ❌ WRONG - Throw in business logic
class AuthService {
  verifyCode(code: string): AsyncResult<AppError, User> {
    if (!/^\d{6}$/.test(code)) {
      throw new Error('Invalid code'); // ❌
    }
    // ...
  }
}
```

---

## Service Structure Template

```typescript
import { AsyncResult, AppError } from '@/lib/fp';
import { UserAdapter } from '@/lib/db/adapters';

/**
 * UserService - User business logic
 *
 * All methods are pure and return AsyncResult.
 * Execution happens only at edges (API routes).
 */
export class UserService {
  /**
   * Get user by ID with validation
   * @returns AsyncResult<AppError, User>
   * - Err(validation) if ID invalid
   * - Err(not-found) if user doesn't exist
   * - Err(database) if query fails
   */
  static getUser(id: number): AsyncResult<AppError, User> {
    // Input validation (pure)
    if (id <= 0) {
      return AsyncResult.err(
        AppError.validation('Invalid user ID', { id })
      );
    }

    // Adapter call (impure, wrapped)
    return UserAdapter.findById(id);
  }

  /**
   * Private helper methods can also return AsyncResult
   * for composition within the service.
   */
  private static validateUser(user: User): AsyncResult<AppError, User> {
    if (!user.email) {
      return AsyncResult.err(
        AppError.validation('User must have email')
      );
    }
    return AsyncResult.ok(user);
  }
}
```

---

## Pattern 1: Sequential Composition

Use `andThen` for operations that must happen in order:

```typescript
class TranslationService {
  static translate(
    phrase: string,
    sourceLanguage: string,
    targetLanguage: string,
    now: Date
  ): AsyncResult<AppError, TranslationResult> {
    return this.checkInMemoryCache(cacheKey)
      .andThen(cached => {
        if (cached) return AsyncResult.ok(cached);

        return this.checkDatabaseCache(phrase, sourceLanguage, targetLanguage, now)
          .andThen(dbCached => {
            if (dbCached) return this.toTranslationResult(dbCached);

            return this.callDeepSeekAPI(phrase, sourceLanguage, targetLanguage)
              .andThen(response => this.parseAPIResponse(response, sourceLanguage, targetLanguage))
              .andThen(parsed => this.saveTranslation(phrase, sourceLanguage, targetLanguage, parsed, now));
          });
      });
  }

  private static checkInMemoryCache(key: string): AsyncResult<AppError, TranslationResult | null> {
    const cached = getInMemoryCache(key);
    return AsyncResult.ok(cached);
  }
}
```

---

## Pattern 2: Parallel Operations

Use `AsyncResult.parallelCombine` or `AsyncResult.all` for independent operations:

```typescript
class ReviewService {
  static getDueCards(userId: number, now: Date): AsyncResult<AppError, DueCard[]> {
    return UserAdapter.findById(userId)
      .andThen(user => {
        // Run these in parallel since they're independent
        return AsyncResult.parallelCombine(
          SRSAdapter.findDueCards(user.id, now, user.dailyReviewLimit),
          StatsAdapter.getReviewedCount(user.id, now)
        ).map(([cards, stats]) => ({
          cards,
          stats
        }));
      });
  }
}
```

---

## Pattern 3: Error Recovery

Use `recoverWith` for graceful degradation:

```typescript
class TranslationService {
  static translateWithFallback(
    phrase: string,
    sourceLanguage: string,
    targetLanguage: string
  ): AsyncResult<AppError, TranslationResult> {
    return this.translate(phrase, sourceLanguage, targetLanguage, new Date())
      .recoverWith(error => {
        // If external API is down, try cached version
        if (error.kind === 'service-unavailable' || error.kind === 'network') {
          return this.getStaleCache(phrase, sourceLanguage, targetLanguage)
            .andThen(stale => stale
              ? AsyncResult.ok(this.withStaleWarning(stale))
              : AsyncResult.err(error)
            );
        }
        return AsyncResult.err(error);
      });
  }
}
```

---

## Pattern 4: Validation Chains

Combine multiple validations:

```typescript
class PhraseService {
  static savePhrase(
    userId: number,
    data: SavePhraseRequest
  ): AsyncResult<AppError, Phrase> {
    // Validate first (pure), then call adapter
    return this.validateRequest(data)
      .andThen(validated => {
        return UserAdapter.findById(userId)
          .andThen(user => {
            if (!user) {
              return AsyncResult.err(AppError.authentication('User not found'));
            }
            return PhraseAdapter.create({
              ...validated,
              userId: user.id
            });
          });
      });
  }

  private static validateRequest(data: SavePhraseRequest): AsyncResult<AppError, ValidatedRequest> {
    // Chain validations
    let result = AsyncResult.ok<ValidationError[], ValidatedRequest>({
      sourcePhrase: data.sourcePhrase,
      translation: data.translation,
      sourceLanguage: data.sourceLanguage,
      targetLanguage: data.targetLanguage
    });

    // Each validation adds to errors if fails
    if (!data.sourcePhrase?.trim()) {
      result = AsyncResult.err(AppError.validation('sourcePhrase is required'));
      return result; // Early return on first error
    }

    if (!data.translation?.trim()) {
      return AsyncResult.err(AppError.validation('translation is required'));
    }

    if (!isValidLanguage(data.sourceLanguage)) {
      return AsyncResult.err(AppError.validation('Invalid sourceLanguage'));
    }

    if (!isValidLanguage(data.targetLanguage)) {
      return AsyncResult.err(AppError.validation('Invalid targetLanguage'));
    }

    return result;
  }
}
```

---

## Complex Workflow: TranslationService

The TranslationService demonstrates the most complex workflow with multi-level caching:

```typescript
export class TranslationService {
  /**
   * Main translation method with cache hierarchy
   *
   * Cache levels (checked in order):
   * 1. In-memory LRU cache (fastest, volatile)
   * 2. Database translation cache (7-day TTL)
   * 3. User's saved phrases (persistent)
   * 4. DeepSeek API (external, slowest)
   *
   * On cache miss:
   * - Call API
   * - Parse response
   * - Save to both cache tables
   * - Update in-memory cache
   */
  static translate(
    phrase: string,
    sourceLanguage: string,
    targetLanguage: string,
    now: Date
  ): AsyncResult<AppError, TranslationResult> {
    const cacheKey = this.buildCacheKey(phrase, sourceLanguage, targetLanguage);

    // Level 1: Check in-memory cache
    return this.checkInMemoryCache(cacheKey)
      .andThen(memCached => {
        if (memCached) {
          return AsyncResult.ok(memCached);
        }

        // Level 2: Check database cache
        return TranslationCacheAdapter.get(
          phrase,
          sourceLanguage,
          targetLanguage,
          now
        ).andThen(dbCached => {
          if (dbCached) {
            const result = this.toTranslationResult(dbCached);
            // Promote to in-memory cache (side effect handled at edge)
            return AsyncResult.ok(result);
          }

          // Level 3: Check user phrases
          return this.findInPhrases(phrase, sourceLanguage, targetLanguage)
            .andThen(phraseResult => {
              if (phraseResult) {
                return AsyncResult.ok(phraseResult);
              }

              // Level 4: Call external API
              return this.fetchAndCache(phrase, sourceLanguage, targetLanguage, now);
            });
        });
      });
  }

  private static buildCacheKey(
    phrase: string,
    sourceLanguage: string,
    targetLanguage: string
  ): string {
    return `${phrase}|${sourceLanguage}|${targetLanguage}`;
  }

  private static fetchAndCache(
    phrase: string,
    sourceLanguage: string,
    targetLanguage: string,
    now: Date
  ): AsyncResult<AppError, TranslationResult> {
    return this.callDeepSeekAPI(phrase, sourceLanguage, targetLanguage)
      .andThen(response => this.parseAPIResponse(response, sourceLanguage, targetLanguage))
      .andThen(parsed => {
        // Save to both cache tables in parallel
        const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

        return AsyncResult.parallelCombine(
          TranslationCacheAdapter.save(
            phrase,
            sourceLanguage,
            targetLanguage,
            parsed.translation,
            parsed.pronunciations,
            expiresAt
          ),
          PhraseAdapter.create({
            sourcePhrase: phrase,
            translation: parsed.translation,
            sourceLanguage,
            targetLanguage,
            pronunciations: parsed.pronunciations
          })
        ).map(([cached, phrase]) => this.toTranslationResult(cached));
      });
  }
}
```

---

## SRS Algorithm Implementation (ReviewService)

The SuperMemo-2 algorithm is pure math - perfect for functional programming:

```typescript
export class ReviewService {
  /**
   * Update card rating using SM-2 algorithm
   *
   * Algorithm:
   * - Again: reset interval, repetitions = 0
   * - Hard: interval * 1.2, ease factor - 0.1
   * - Good: interval * ease factor, repetitions + 1
   * - Easy: interval * ease factor * 1.3, ease factor + 0.1
   *
   * @returns AsyncResult<AppError, ReviewResult>
   */
  static updateRating(
    phraseId: number,
    userId: number,
    rating: ReviewRating,
    now: Date
  ): AsyncResult<AppError, ReviewResult> {
    // Validate rating
    if (!this.isValidRating(rating)) {
      return AsyncResult.err(
        AppError.validation('Invalid rating', { rating })
      );
    }

    return SRSAdapter.findByPhraseId(phraseId)
      .andThen(srsData => {
        if (!srsData) {
          return SRSAdapter.create(phraseId)
            .andThen(newData => this.calculateNextReview(newData, rating, now));
        }

        return this.calculateNextReview(srsData, rating, now)
          .andThen(calculated =>
            SRSAdapter.updateReview(
              srsData.id,
              rating,
              calculated.nextReviewDate,
              calculated.easeFactor,
              calculated.interval,
              calculated.repetitions
            )
          );
      });
  }

  /**
   * Pure SM-2 algorithm calculation
   * No I/O, just math
   */
  private static calculateNextReview(
    data: SRSData,
    rating: ReviewRating,
    now: Date
  ): AsyncResult<AppError, CalculatedReview> {
    const { easeFactor, interval, repetitions } = data;

    let newEaseFactor = easeFactor / 100; // Convert from integer
    let newInterval = interval;
    let newRepetitions = repetitions;

    switch (rating) {
      case 'again':
        // Reset - start over
        newInterval = 0;
        newRepetitions = 0;
        break;

      case 'hard':
        // Slight penalty
        newEaseFactor = Math.max(1.3, newEaseFactor - 0.1);
        if (repetitions === 0) {
          newInterval = 0;
        } else {
          newInterval = Math.max(1, Math.floor(newInterval * 1.2));
        }
        break;

      case 'good':
        // Normal progression
        if (repetitions === 0) {
          newInterval = 1;
        } else if (repetitions === 1) {
          newInterval = 6;
        } else {
          newInterval = Math.max(1, Math.floor(newInterval * newEaseFactor));
        }
        newRepetitions += 1;
        break;

      case 'easy':
        // Bonus
        newEaseFactor += 0.1;
        if (repetitions === 0) {
          newInterval = 1;
        } else if (repetitions === 1) {
          newInterval = 6;
        } else {
          newInterval = Math.max(1, Math.floor(newInterval * newEaseFactor * 1.3));
        }
        newRepetitions += 1;
        break;
    }

    // Cap values
    newEaseFactor = Math.max(1.3, Math.min(2.5, newEaseFactor));
    const maxInterval = 365; // From user settings (simplified)
    newInterval = Math.min(maxInterval, newInterval);

    // Calculate next review date
    const nextReviewDate = new Date(now);
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return AsyncResult.ok({
      nextReviewDate,
      easeFactor: Math.round(newEaseFactor * 100), // Store as integer
      interval: newInterval,
      repetitions: newRepetitions
    });
  }

  private static isValidRating(rating: string): rating is ReviewRating {
    return ['again', 'hard', 'good', 'easy'].includes(rating);
  }
}
```

---

## Testing Services

Services are easy to test because they're pure:

```typescript
describe('TranslationService', () => {
  describe('translate', () => {
    it('should return cached translation from in-memory cache', async () => {
      const cached = { translation: 'Konnichiwa', /* ... */ };
      vi.mocked(getInMemoryCache).mockReturnValue(cached);

      const result = await TranslationService.translate(
        'Hello',
        'English',
        'Japanese',
        new Date()
      ).run();

      expect(result.isOk()).toBe(true);
      expect(result.unwrapOr(null)).toEqual(cached);
    });

    it('should call API when cache miss', async () => {
      vi.mocked(getInMemoryCache).mockReturnValue(null);

      const result = await TranslationService.translate(
        'Hello',
        'English',
        'Japanese',
        new Date()
      ).run();

      expect(result.isOk()).toBe(true);
      // Verify API was called, cache was updated, etc.
    });
  });
});
```

---

## Common Patterns Quick Reference

| Pattern | Use When | Method |
|---------|----------|--------|
| Sequential operations | Step-by-step workflow | `.andThen()` |
| Parallel operations | Independent calls | `AsyncResult.parallelCombine()` / `.all()` |
| Error recovery | Graceful degradation | `.recoverWith()` |
| Input validation | Check before I/O | Return `Err` early |
| Cache hierarchy | Multi-level caching | Nested `.andThen()` with early returns |
| Pure calculation | Math/logic only | Helper method returning `AsyncResult.ok()` |

---

## Checklist for Each Service

- [ ] All methods return `AsyncResult<AppError, T>`
- [ ] No `await` or `.run()` calls in service methods
- [ ] No `throw` statements
- [ ] All validation returns `Err(validation)` immediately
- [ ] Helper methods are private static
- [ ] Side effects only at adapter layer
- [ ] Tests cover success and error paths
- [ ] Tests use real adapters (no mocks) or test doubles

---

## Related Documentation

- [FP Architecture](./fp-architecture.md) - Complete service specifications
- [FP Patterns](./fp-patterns.md) - Common composition patterns
- [FP Anti-Patterns](./fp-anti-patterns.md) - Mistakes to avoid
