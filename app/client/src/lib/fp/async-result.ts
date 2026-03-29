/**
 * AsyncResult<E, T> - A Promise-based Result for async operations
 *
 * This module provides a wrapper around Promise<Result<E, T>> to enable
 * composable async operations without executing them until the edge.
 *
 * CRITICAL: Services compose AsyncResults without calling .run() internally.
 * Only call .run() at component edges (event handlers, useEffect, etc.)
 */
import { Result, Result as ResultType } from './result';
import { AppError } from './errors';

// Interface for chainable AsyncResult methods
interface AsyncResultMethods<E, T> {
  readonly _tag: 'AsyncResult';
  run: () => Promise<ResultType<E, T>>;
  map: <B>(f: (a: T) => B) => AsyncResult<E, B>;
  mapErr: <F>(f: (e: E) => F) => AsyncResult<F, T>;
  andThen: <B>(f: (a: T) => AsyncResult<E, B>) => AsyncResult<E, B>;
  orElse: <F>(f: (e: E) => AsyncResult<F, T>) => AsyncResult<F, T>;
  tap: (onResult: (result: ResultType<E, T>) => void) => AsyncResult<E, T>;
  tapOk: (f: (value: T) => void) => AsyncResult<E, T>;
  tapErr: (f: (error: E) => void) => AsyncResult<E, T>;
}

// The type representing a deferred async computation with chainable methods
export type AsyncResult<E, T> = AsyncResultMethods<E, T>;

// Convenience type alias for our standard AsyncResult
export type AppAsyncResult<T> = AsyncResult<AppError, T>;

/**
 * Internal helper to create an AsyncResult from a thunk with chainable methods
 */
function makeAsyncResult<E, T>(
  run: () => Promise<ResultType<E, T>>
): AsyncResult<E, T> {
  const asyncResult: AsyncResult<E, T> = {
    _tag: 'AsyncResult',
    run,

    map: <B>(f: (a: T) => B): AsyncResult<E, B> =>
      makeAsyncResult(async () => {
        const result = await run();
        if (Result.isErr(result)) {
          return Result.err(result.left) as ResultType<E, B>;
        }
        return Result.ok(f(result.right));
      }),

    mapErr: <F>(f: (e: E) => F): AsyncResult<F, T> =>
      makeAsyncResult(async () => {
        const result = await run();
        if (Result.isErr(result)) {
          return Result.err(f(result.left));
        }
        return Result.ok(result.right) as ResultType<F, T>;
      }),

    andThen: <B>(f: (a: T) => AsyncResult<E, B>): AsyncResult<E, B> =>
      makeAsyncResult(async () => {
        const result = await run();
        if (Result.isErr(result)) {
          return Result.err(result.left) as ResultType<E, B>;
        }
        return f(result.right).run();
      }),

    orElse: <F>(f: (e: E) => AsyncResult<F, T>): AsyncResult<F, T> =>
      makeAsyncResult(async () => {
        const result = await run();
        if (Result.isOk(result)) {
          return Result.ok(result.right) as ResultType<F, T>;
        }
        return f(result.left).run();
      }),

    tap: (onResult: (result: ResultType<E, T>) => void): AsyncResult<E, T> =>
      makeAsyncResult(async () => {
        const result = await run();
        onResult(result);
        return result;
      }),

    tapOk: (f: (value: T) => void): AsyncResult<E, T> =>
      makeAsyncResult(async () => {
        const result = await run();
        if (Result.isOk(result)) {
          f(result.right);
        }
        return result;
      }),

    tapErr: (f: (error: E) => void): AsyncResult<E, T> =>
      makeAsyncResult(async () => {
        const result = await run();
        if (Result.isErr(result)) {
          f(result.left);
        }
        return result;
      }),
  };

  return asyncResult;
}

/**
 * AsyncResult namespace with all operations (curried style for compatibility)
 */
export const AsyncResult = {
  /**
   * Create an AsyncResult from a value
   */
  ok: <T, E = AppError>(value: T): AsyncResult<E, T> =>
    makeAsyncResult(async () => Result.ok(value)),

  /**
   * Create an AsyncResult from an error
   */
  err: <E, T = never>(error: E): AsyncResult<E, T> =>
    makeAsyncResult(async () => Result.err(error)),

  /**
   * Create an AsyncResult from a Promise
   */
  fromPromise: <T, E>(
    promise: Promise<T>,
    onError: (error: unknown) => E
  ): AsyncResult<E, T> =>
    makeAsyncResult(async () => {
      try {
        const value = await promise;
        return Result.ok(value);
      } catch (error) {
        return Result.err(onError(error));
      }
    }),

  /**
   * Create an AsyncResult from a synchronous function
   */
  fromThunk: <T, E>(f: () => ResultType<E, T>): AsyncResult<E, T> =>
    makeAsyncResult(async () => f()),

  /**
   * Map over an AsyncResult's success value (curried)
   */
  map: <A, B, E>(f: (a: A) => B) => (asyncResult: AsyncResult<E, A>): AsyncResult<E, B> =>
    asyncResult.map(f),

  /**
   * Map over an AsyncResult's error value (curried)
   */
  mapErr: <E, F, T>(
    f: (e: E) => F
  ) => (asyncResult: AsyncResult<E, T>): AsyncResult<F, T> =>
    asyncResult.mapErr(f),

  /**
   * FlatMap over an AsyncResult's success value (curried)
   * This is the key operation for composing async operations
   */
  andThen: <A, B, E>(
    f: (a: A) => AsyncResult<E, B>
  ) => (asyncResult: AsyncResult<E, A>): AsyncResult<E, B> =>
    asyncResult.andThen(f),

  /**
   * Alias for andThen (more intuitive name)
   */
  flatMap: <A, B, E>(
    f: (a: A) => AsyncResult<E, B>
  ) => (asyncResult: AsyncResult<E, A>): AsyncResult<E, B> =>
    asyncResult.andThen(f),

  /**
   * FlatMap over an AsyncResult's error value (recovery) (curried)
   */
  orElse: <E, F, T>(
    f: (e: E) => AsyncResult<F, T>
  ) => (asyncResult: AsyncResult<E, T>): AsyncResult<F, T> =>
    asyncResult.orElse(f),

  /**
   * Pattern match on an AsyncResult
   */
  match: <E, T, R>(
    onErr: (error: E) => R,
    onOk: (value: T) => R
  ) => async (asyncResult: AsyncResult<E, T>): Promise<R> => {
    const result = await asyncResult.run();
    return Result.match(onErr, onOk)(result);
  },

  /**
   * Get the success value or a default
   */
  unwrapOr: async <T, E>(defaultValue: T, asyncResult: AsyncResult<E, T>): Promise<T> => {
    const result = await asyncResult.run();
    return Result.unwrapOr(defaultValue, result);
  },

  /**
   * Combine two AsyncResults in parallel
   */
  zip: <E, A, B>(
    asyncResultA: AsyncResult<E, A>,
    asyncResultB: AsyncResult<E, B>
  ): AsyncResult<E, [A, B]> =>
    makeAsyncResult(async () => {
      const [resultA, resultB] = await Promise.all([
        asyncResultA.run(),
        asyncResultB.run(),
      ]);
      return Result.zip(resultA, resultB);
    }),

  /**
   * Combine an array of AsyncResults in parallel
   */
  all: <E, T>(asyncResults: AsyncResult<E, T>[]): AsyncResult<E, T[]> =>
    makeAsyncResult(async () => {
      const results = await Promise.all(asyncResults.map((ar) => ar.run()));
      return Result.sequence(results);
    }),

  /**
   * Combine AsyncResults sequentially (stops on first error)
   */
  sequence: <E, T>(asyncResults: AsyncResult<E, T>[]): AsyncResult<E, T[]> =>
    makeAsyncResult(async () => {
      const values: T[] = [];
      for (const asyncResult of asyncResults) {
        const result = await asyncResult.run();
        if (Result.isErr(result)) {
          return Result.err(result.left) as ResultType<E, T[]>;
        }
        values.push(result.right);
      }
      return Result.ok(values);
    }),

  /**
   * Race two AsyncResults (returns first to complete)
   */
  race: <E, T>(
    asyncResultA: AsyncResult<E, T>,
    asyncResultB: AsyncResult<E, T>
  ): AsyncResult<E, T> =>
    makeAsyncResult(async () => {
      const results = await Promise.race([
        asyncResultA.run(),
        asyncResultB.run(),
      ]);
      return results;
    }),

  /**
   * Add a timeout to an AsyncResult
   */
  timeout: <E, T>(
    ms: number,
    onTimeout: () => E
  ) => (asyncResult: AsyncResult<E, T>): AsyncResult<E, T> =>
    makeAsyncResult(async () => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
      );

      try {
        const result = await Promise.race([asyncResult.run(), timeoutPromise]);
        return result;
      } catch {
        return Result.err(onTimeout());
      }
    }),

  /**
   * Retry an AsyncResult with exponential backoff
   */
  retry: <E, T>(
    maxRetries: number,
    shouldRetry: (error: E) => boolean = () => true
  ) => (asyncResult: AsyncResult<E, T>): AsyncResult<E, T> =>
    makeAsyncResult(async () => {
      let lastError: E | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const result = await asyncResult.run();
        if (Result.isOk(result)) {
          return result;
        }
        lastError = result.left;
        if (!shouldRetry(result.left)) {
          return result;
        }
        // Exponential backoff: 100ms, 200ms, 400ms, etc.
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * Math.pow(2, attempt))
          );
        }
      }

      return Result.err(lastError as E);
    }),

  /**
   * Execute the AsyncResult and return the Promise<Result>
   * This is the only way to actually run the computation
   */
  run: async <E, T>(asyncResult: AsyncResult<E, T>): Promise<ResultType<E, T>> =>
    asyncResult.run(),

  /**
   * Tap into the result without modifying it (for side effects like logging) (curried)
   */
  tap: <E, T>(
    onResult: (result: ResultType<E, T>) => void
  ) => (asyncResult: AsyncResult<E, T>): AsyncResult<E, T> =>
    asyncResult.tap(onResult),

  /**
   * Tap only on success (curried)
   */
  tapOk: <T>(f: (value: T) => void) => <E>(asyncResult: AsyncResult<E, T>): AsyncResult<E, T> =>
    asyncResult.tapOk(f),

  /**
   * Tap only on error (curried)
   */
  tapErr: <E>(f: (error: E) => void) => <T>(asyncResult: AsyncResult<E, T>): AsyncResult<E, T> =>
    asyncResult.tapErr(f),
};
