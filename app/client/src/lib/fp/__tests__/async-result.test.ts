/**
 * Tests for AsyncResult<E, T> type
 */
import { describe, it, expect } from 'vitest';
import { AsyncResult } from '../async-result';
import { Result } from '../result';
import { AppError } from '../errors';

describe('AsyncResult', () => {
  describe('ok', () => {
    it('creates a successful AsyncResult', async () => {
      const asyncResult = AsyncResult.ok(42);
      const result = await asyncResult.run();
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toBe(42);
    });
  });

  describe('err', () => {
    it('creates a failed AsyncResult', async () => {
      const error = AppError.validation('Test');
      const asyncResult = AsyncResult.err(error);
      const result = await asyncResult.run();
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result)).toBe(error);
    });
  });

  describe('fromPromise', () => {
    it('wraps a successful promise', async () => {
      const asyncResult = AsyncResult.fromPromise(
        Promise.resolve(42),
        (e) => AppError.internal('Failed', {}, e)
      );
      const result = await asyncResult.run();
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('wraps a rejected promise', async () => {
      const asyncResult = AsyncResult.fromPromise(
        Promise.reject(new Error('Failed')),
        (e) => AppError.internal('Failed', {}, e)
      );
      const result = await asyncResult.run();
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result).kind).toBe('internal');
    });
  });

  describe('fromThunk', () => {
    it('wraps a synchronous Result', async () => {
      const asyncResult = AsyncResult.fromThunk(() => Result.ok(42));
      const result = await asyncResult.run();
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toBe(42);
    });
  });

  describe('map', () => {
    it('transforms the success value', async () => {
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.ok(5);
      const mapped = AsyncResult.map((x: number) => x * 2)(asyncResult);
      const result = await mapped.run();
      expect(Result.unwrap(result)).toBe(10);
    });

    it('preserves error', async () => {
      const error = AppError.validation('Test');
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.err(error);
      const mapped = AsyncResult.map((x: number) => x * 2)(asyncResult);
      const result = await mapped.run();
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result)).toBe(error);
    });
  });

  describe('mapErr', () => {
    it('transforms the error value', async () => {
      const error = AppError.validation('Test');
      const asyncResult: AsyncResult<AppError, string> = AsyncResult.err(error);
      const mapped = AsyncResult.mapErr((e: AppError) =>
        AppError.internal(e.message)
      )(asyncResult);
      const result = await mapped.run();
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result).kind).toBe('internal');
    });
  });

  describe('andThen', () => {
    it('chains successful async operations', async () => {
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.ok(5);
      const chained = AsyncResult.andThen((x: number) =>
        AsyncResult.ok(x * 2)
      )(asyncResult);
      const result = await chained.run();
      expect(Result.unwrap(result)).toBe(10);
    });

    it('propagates errors', async () => {
      const error = AppError.validation('Test');
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.err(error);
      const chained = AsyncResult.andThen((x: number) =>
        AsyncResult.ok(x * 2)
      )(asyncResult);
      const result = await chained.run();
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result)).toBe(error);
    });

    it('returns error from chained operation', async () => {
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.ok(5);
      const chained = AsyncResult.andThen((_: number) =>
        AsyncResult.err(AppError.validation('Failed'))
      )(asyncResult);
      const result = await chained.run();
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result).kind).toBe('validation');
    });

    it('chains async operations in sequence', async () => {
      const step1: AsyncResult<AppError, number> = AsyncResult.ok(5);
      const step2 = AsyncResult.andThen((x: number) =>
        AsyncResult.fromPromise(
          Promise.resolve(x * 2),
          (e) => AppError.internal('Failed', {}, e)
        )
      )(step1);
      const step3 = AsyncResult.andThen((x: number) =>
        AsyncResult.ok(x + 10)
      )(step2);

      const result = await step3.run();
      expect(Result.unwrap(result)).toBe(20);
    });
  });

  describe('flatMap', () => {
    it('is an alias for andThen', async () => {
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.ok(5);
      const chained = AsyncResult.flatMap((x: number) =>
        AsyncResult.ok(x * 2)
      )(asyncResult);
      const result = await chained.run();
      expect(Result.unwrap(result)).toBe(10);
    });
  });

  describe('orElse', () => {
    it('recovers from error', async () => {
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.err(AppError.validation('Test'));
      const recovered = AsyncResult.orElse((_: AppError) =>
        AsyncResult.ok(42)
      )(asyncResult);
      const result = await recovered.run();
      expect(Result.unwrap(result)).toBe(42);
    });

    it('preserves success', async () => {
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.ok(5);
      const recovered = AsyncResult.orElse((_: AppError) =>
        AsyncResult.ok(42)
      )(asyncResult);
      const result = await recovered.run();
      expect(Result.unwrap(result)).toBe(5);
    });
  });

  describe('match', () => {
    it('calls onOk for success', async () => {
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.ok(42);
      const matched = await AsyncResult.match(
        (e: AppError) => `error: ${e.message}`,
        (x: number) => `ok: ${x}`
      )(asyncResult);
      expect(matched).toBe('ok: 42');
    });

    it('calls onErr for error', async () => {
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.err(AppError.validation('Test'));
      const matched = await AsyncResult.match(
        (e: AppError) => `error: ${e.message}`,
        (x: number) => `ok: ${x}`
      )(asyncResult);
      expect(matched).toBe('error: Test');
    });
  });

  describe('unwrapOr', () => {
    it('returns the value for success', async () => {
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.ok(42);
      const value = await AsyncResult.unwrapOr(0, asyncResult);
      expect(value).toBe(42);
    });

    it('returns the default for error', async () => {
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.err(AppError.validation('Test'));
      const value = await AsyncResult.unwrapOr(0, asyncResult);
      expect(value).toBe(0);
    });
  });

  describe('zip', () => {
    it('combines two successful AsyncResults', async () => {
      const a: AsyncResult<AppError, number> = AsyncResult.ok(1);
      const b: AsyncResult<AppError, number> = AsyncResult.ok(2);
      const zipped = AsyncResult.zip(a, b);
      const result = await zipped.run();
      expect(Result.unwrap(result)).toEqual([1, 2]);
    });

    it('returns first error', async () => {
      const error = AppError.validation('Error A');
      const a: AsyncResult<AppError, number> = AsyncResult.err(error);
      const b: AsyncResult<AppError, number> = AsyncResult.ok(2);
      const zipped = AsyncResult.zip(a, b);
      const result = await zipped.run();
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result)).toBe(error);
    });

    it('runs in parallel', async () => {
      const start = Date.now();
      const a = AsyncResult.fromPromise(
        new Promise((resolve) => setTimeout(() => resolve(1), 50)),
        () => AppError.internal('Failed')
      );
      const b = AsyncResult.fromPromise(
        new Promise((resolve) => setTimeout(() => resolve(2), 50)),
        () => AppError.internal('Failed')
      );
      const zipped = AsyncResult.zip(a, b);
      await zipped.run();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100); // Should be ~50ms, not ~100ms
    });
  });

  describe('all', () => {
    it('combines array of successful AsyncResults', async () => {
      const asyncResults: AsyncResult<AppError, number>[] = [
        AsyncResult.ok(1),
        AsyncResult.ok(2),
        AsyncResult.ok(3),
      ];
      const combined = AsyncResult.all(asyncResults);
      const result = await combined.run();
      expect(Result.unwrap(result)).toEqual([1, 2, 3]);
    });

    it('runs in parallel', async () => {
      const start = Date.now();
      const asyncResults = [
        AsyncResult.fromPromise(
          new Promise((resolve) => setTimeout(() => resolve(1), 30)),
          () => AppError.internal('Failed')
        ),
        AsyncResult.fromPromise(
          new Promise((resolve) => setTimeout(() => resolve(2), 30)),
          () => AppError.internal('Failed')
        ),
        AsyncResult.fromPromise(
          new Promise((resolve) => setTimeout(() => resolve(3), 30)),
          () => AppError.internal('Failed')
        ),
      ];
      const combined = AsyncResult.all(asyncResults);
      await combined.run();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(80); // Should be ~30ms, not ~90ms
    });
  });

  describe('sequence', () => {
    it('combines AsyncResults sequentially', async () => {
      const order: number[] = [];
      const asyncResults: AsyncResult<AppError, number>[] = [
        AsyncResult.tapOk((x: number) => order.push(x))(AsyncResult.ok(1)),
        AsyncResult.tapOk((x: number) => order.push(x))(AsyncResult.ok(2)),
        AsyncResult.tapOk((x: number) => order.push(x))(AsyncResult.ok(3)),
      ];
      const combined = AsyncResult.sequence(asyncResults);
      const result = await combined.run();

      expect(Result.unwrap(result)).toEqual([1, 2, 3]);
      expect(order).toEqual([1, 2, 3]);
    });

    it('stops on first error', async () => {
      const asyncResults: AsyncResult<AppError, number>[] = [
        AsyncResult.ok(1),
        AsyncResult.err(AppError.validation('Error')),
        AsyncResult.ok(3),
      ];
      const combined = AsyncResult.sequence(asyncResults);
      const result = await combined.run();

      expect(Result.isErr(result)).toBe(true);
    });
  });

  describe('race', () => {
    it('returns first to complete', async () => {
      const a = AsyncResult.fromPromise(
        new Promise((resolve) => setTimeout(() => resolve(1), 50)),
        () => AppError.internal('Failed')
      );
      const b = AsyncResult.fromPromise(
        new Promise((resolve) => setTimeout(() => resolve(2), 10)),
        () => AppError.internal('Failed'
      ));
      const raced = AsyncResult.race(a, b);
      const result = await raced.run();

      expect(Result.unwrap(result)).toBe(2);
    });
  });

  describe('timeout', () => {
    it('returns result if completes in time', async () => {
      const asyncResult = AsyncResult.fromPromise(
        Promise.resolve(42),
        () => AppError.internal('Failed')
      );
      const withTimeout = AsyncResult.timeout(1000, () =>
        AppError.serviceUnavailable('Timeout')
      )(asyncResult);
      const result = await withTimeout.run();

      expect(Result.unwrap(result)).toBe(42);
    });

    it('returns timeout error if too slow', async () => {
      const asyncResult = AsyncResult.fromPromise(
        new Promise((resolve) => setTimeout(() => resolve(42), 100)),
        () => AppError.internal('Failed')
      );
      const withTimeout = AsyncResult.timeout(10, () =>
        AppError.serviceUnavailable('Timeout')
      )(asyncResult);
      const result = await withTimeout.run();

      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result).kind).toBe('service-unavailable');
    });
  });

  describe('retry', () => {
    it('fails after max retries', async () => {
      const asyncResult = AsyncResult.fromPromise(
        Promise.reject(new Error('Always fails')),
        () => AppError.internal('Failed')
      );
      const withRetry = AsyncResult.retry(2)(asyncResult);
      const result = await withRetry.run();

      expect(Result.isErr(result)).toBe(true);
    });

    it('respects shouldRetry', async () => {
      const asyncResult = AsyncResult.fromPromise(
        Promise.reject(new Error('Error')),
        () => AppError.validation('Failed')
      );
      const withRetry = AsyncResult.retry(
        3,
        (e: AppError) => e.kind !== 'validation'
      )(asyncResult);
      const result = await withRetry.run();

      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result).kind).toBe('validation');
    });
  });

  describe('tap', () => {
    it('executes side effect without modifying result', async () => {
      let sideEffect = 0;
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.ok(42);
      const tapped = AsyncResult.tap((result) => {
        if (Result.isOk(result)) {
          sideEffect = result.right as number;
        }
      })(asyncResult);

      const result = await tapped.run();
      expect(Result.unwrap(result)).toBe(42);
      expect(sideEffect).toBe(42);
    });
  });

  describe('tapOk', () => {
    it('executes side effect on success', async () => {
      let sideEffect = 0;
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.ok(42);
      const tapped = AsyncResult.tapOk((x: number) => {
        sideEffect = x;
      })(asyncResult);

      const result = await tapped.run();
      expect(Result.unwrap(result)).toBe(42);
      expect(sideEffect).toBe(42);
    });

    it('does not execute side effect on error', async () => {
      let sideEffect = 0;
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.err(AppError.validation('Test'));
      const tapped = AsyncResult.tapOk((x: number) => {
        sideEffect = x;
      })(asyncResult);

      await tapped.run();
      expect(sideEffect).toBe(0);
    });
  });

  describe('tapErr', () => {
    it('executes side effect on error', async () => {
      let capturedError: AppError | null = null;
      const error = AppError.validation('Test');
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.err(error);
      const tapped = AsyncResult.tapErr((e: AppError) => {
        capturedError = e;
      })(asyncResult);

      await tapped.run();
      expect(capturedError).toBe(error);
    });

    it('does not execute side effect on success', async () => {
      let sideEffect = false;
      const asyncResult: AsyncResult<AppError, number> = AsyncResult.ok(42);
      const tapped = AsyncResult.tapErr((_: AppError) => {
        sideEffect = true;
      })(asyncResult);

      await tapped.run();
      expect(sideEffect).toBe(false);
    });
  });
});
