/**
 * Tests for Result<E, T> type
 */
import { describe, it, expect } from 'vitest';
import { Result } from '../result';
import { AppError } from '../errors';

describe('Result', () => {
  describe('ok', () => {
    it('creates an Ok value', () => {
      const result = Result.ok(42);
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toBe(42);
    });
  });

  describe('err', () => {
    it('creates an Err value', () => {
      const error = AppError.validation('Test error');
      const result = Result.err(error);
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result)).toBe(error);
    });
  });

  describe('isOk', () => {
    it('returns true for Ok', () => {
      const result = Result.ok(42);
      expect(Result.isOk(result)).toBe(true);
    });

    it('returns false for Err', () => {
      const result = Result.err(AppError.validation('Test'));
      expect(Result.isOk(result)).toBe(false);
    });
  });

  describe('isErr', () => {
    it('returns true for Err', () => {
      const result = Result.err(AppError.validation('Test'));
      expect(Result.isErr(result)).toBe(true);
    });

    it('returns false for Ok', () => {
      const result = Result.ok(42);
      expect(Result.isErr(result)).toBe(false);
    });
  });

  describe('map', () => {
    it('transforms the success value', () => {
      const result = Result.ok(5);
      const mapped = Result.map((x: number) => x * 2)(result);
      expect(Result.unwrap(mapped)).toBe(10);
    });

    it('preserves error', () => {
      const error = AppError.validation('Test');
      const result: Result<AppError, number> = Result.err(error);
      const mapped = Result.map((x: number) => x * 2)(result);
      expect(Result.isErr(mapped)).toBe(true);
      expect(Result.unwrapError(mapped)).toBe(error);
    });
  });

  describe('mapErr', () => {
    it('transforms the error value', () => {
      const error = AppError.validation('Test');
      const result: Result<AppError, string> = Result.err(error);
      const mapped = Result.mapErr((e: AppError) =>
        AppError.internal(e.message)
      )(result);
      expect(Result.isErr(mapped)).toBe(true);
      expect(Result.unwrapError(mapped).kind).toBe('internal');
    });

    it('preserves success', () => {
      const result: Result<AppError, number> = Result.ok(42);
      const mapped = Result.mapErr((e: AppError) => AppError.internal(e.message))(result);
      expect(Result.isOk(mapped)).toBe(true);
      expect(Result.unwrap(mapped)).toBe(42);
    });
  });

  describe('bimap', () => {
    it('maps both sides', () => {
      const result: Result<AppError, number> = Result.ok(5);
      const mapped = Result.bimap(
        (e: AppError) => AppError.internal(e.message),
        (x: number) => x * 2
      )(result);
      expect(Result.unwrap(mapped)).toBe(10);
    });

    it('maps error side', () => {
      const error = AppError.validation('Test');
      const result: Result<AppError, number> = Result.err(error);
      const mapped = Result.bimap(
        (e: AppError) => AppError.internal(e.message),
        (x: number) => x * 2
      )(result);
      expect(Result.isErr(mapped)).toBe(true);
      expect(Result.unwrapError(mapped).kind).toBe('internal');
    });
  });

  describe('flatMap', () => {
    it('chains successful operations', () => {
      const result: Result<AppError, number> = Result.ok(5);
      const chained = Result.flatMap((x: number) => Result.ok(x * 2))(result);
      expect(Result.unwrap(chained)).toBe(10);
    });

    it('propagates errors', () => {
      const error = AppError.validation('Test');
      const result: Result<AppError, number> = Result.err(error);
      const chained = Result.flatMap((x: number) => Result.ok(x * 2))(result);
      expect(Result.isErr(chained)).toBe(true);
      expect(Result.unwrapError(chained)).toBe(error);
    });

    it('returns error from chained operation', () => {
      const result: Result<AppError, number> = Result.ok(5);
      const chained = Result.flatMap((_: number) =>
        Result.err(AppError.validation('Failed'))
      )(result);
      expect(Result.isErr(chained)).toBe(true);
      expect(Result.unwrapError(chained).kind).toBe('validation');
    });
  });

  describe('unwrapOr', () => {
    it('returns the value for Ok', () => {
      const result: Result<AppError, number> = Result.ok(42);
      expect(Result.unwrapOr(0, result)).toBe(42);
    });

    it('returns the default for Err', () => {
      const result: Result<AppError, number> = Result.err(AppError.validation('Test'));
      expect(Result.unwrapOr(0, result)).toBe(0);
    });
  });

  describe('unwrap', () => {
    it('returns the value for Ok', () => {
      const result = Result.ok(42);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('throws for Err', () => {
      const error = AppError.validation('Test');
      const result = Result.err(error);
      expect(() => Result.unwrap(result)).toThrow();
    });
  });

  describe('unwrapErrorOr', () => {
    it('returns the error for Err', () => {
      const error = AppError.validation('Test');
      const result = Result.err(error);
      expect(Result.unwrapErrorOr<AppError, number, AppError | null>(null, result)).toBe(error);
    });

    it('returns the default for Ok', () => {
      const result = Result.ok(42);
      expect(Result.unwrapErrorOr<AppError, number, AppError | null>(null, result)).toBeNull();
    });
  });

  describe('unwrapError', () => {
    it('returns the error for Err', () => {
      const error = AppError.validation('Test');
      const result = Result.err(error);
      expect(Result.unwrapError(result)).toBe(error);
    });

    it('throws for Ok', () => {
      const result = Result.ok(42);
      expect(() => Result.unwrapError(result)).toThrow('Called unwrapError on Ok');
    });
  });

  describe('match', () => {
    it('calls onOk for Ok', () => {
      const result: Result<AppError, number> = Result.ok(42);
      const matched = Result.match(
        (e: AppError) => `error: ${e.message}`,
        (x: number) => `ok: ${x}`
      )(result);
      expect(matched).toBe('ok: 42');
    });

    it('calls onErr for Err', () => {
      const result: Result<AppError, number> = Result.err(AppError.validation('Test'));
      const matched = Result.match(
        (e: AppError) => `error: ${e.message}`,
        (x: number) => `ok: ${x}`
      )(result);
      expect(matched).toBe('error: Test');
    });
  });

  describe('tryCatch', () => {
    it('returns Ok for successful function', () => {
      const result = Result.tryCatch(
        () => JSON.parse('{"a": 1}'),
        (e) => AppError.validation('Invalid JSON', {}, e)
      );
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toEqual({ a: 1 });
    });

    it('returns Err for throwing function', () => {
      const result = Result.tryCatch(
        () => JSON.parse('invalid'),
        (e) => AppError.validation('Invalid JSON', {}, e)
      );
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result).kind).toBe('validation');
    });
  });

  describe('tryCatchAsync', () => {
    it('returns Ok for successful async function', async () => {
      const result = await Result.tryCatchAsync(
        async () => Promise.resolve(42),
        (e) => AppError.internal('Failed', {}, e)
      );
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('returns Err for rejecting async function', async () => {
      const result = await Result.tryCatchAsync(
        async () => Promise.reject(new Error('Failed')),
        (e) => AppError.internal('Failed', {}, e)
      );
      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapError(result).kind).toBe('internal');
    });
  });

  describe('toOption', () => {
    it('converts Ok to Some', () => {
      const result = Result.ok(42);
      const option = Result.toOption(result);
      expect(option._tag).toBe('Some');
      if (option._tag === 'Some') {
        expect(option.value).toBe(42);
      }
    });

    it('converts Err to None', () => {
      const result = Result.err(AppError.validation('Test'));
      const option = Result.toOption(result);
      expect(option._tag).toBe('None');
    });
  });

  describe('zip', () => {
    it('combines two Ok values', () => {
      const a: Result<AppError, number> = Result.ok(1);
      const b: Result<AppError, number> = Result.ok(2);
      const zipped = Result.zip(a, b);
      expect(Result.isOk(zipped)).toBe(true);
      expect(Result.unwrap(zipped)).toEqual([1, 2]);
    });

    it('returns first error', () => {
      const error = AppError.validation('Error A');
      const a: Result<AppError, number> = Result.err(error);
      const b: Result<AppError, number> = Result.ok(2);
      const zipped = Result.zip(a, b);
      expect(Result.isErr(zipped)).toBe(true);
      expect(Result.unwrapError(zipped)).toBe(error);
    });

    it('returns second error', () => {
      const error = AppError.validation('Error B');
      const a: Result<AppError, number> = Result.ok(1);
      const b: Result<AppError, number> = Result.err(error);
      const zipped = Result.zip(a, b);
      expect(Result.isErr(zipped)).toBe(true);
      expect(Result.unwrapError(zipped)).toBe(error);
    });
  });

  describe('sequence', () => {
    it('combines array of Ok values', () => {
      const results: Result<AppError, number>[] = [Result.ok(1), Result.ok(2), Result.ok(3)];
      const sequenced = Result.sequence(results);
      expect(Result.isOk(sequenced)).toBe(true);
      expect(Result.unwrap(sequenced)).toEqual([1, 2, 3]);
    });

    it('returns first error', () => {
      const error = AppError.validation('Error');
      const results: Result<AppError, number>[] = [
        Result.ok(1),
        Result.err(error),
        Result.ok(3),
      ];
      const sequenced = Result.sequence(results);
      expect(Result.isErr(sequenced)).toBe(true);
      expect(Result.unwrapError(sequenced)).toBe(error);
    });

    it('handles empty array', () => {
      const results: Result<AppError, number>[] = [];
      const sequenced = Result.sequence(results);
      expect(Result.isOk(sequenced)).toBe(true);
      expect(Result.unwrap(sequenced)).toEqual([]);
    });
  });

  describe('swap', () => {
    it('converts Ok to Err', () => {
      const result = Result.ok(42);
      const swapped = Result.swap(result);
      expect(Result.isErr(swapped)).toBe(true);
      expect(Result.unwrapError(swapped)).toBe(42);
    });

    it('converts Err to Ok', () => {
      const error = AppError.validation('Test');
      const result: Result<AppError, number> = Result.err(error);
      const swapped = Result.swap(result);
      expect(Result.isOk(swapped)).toBe(true);
      expect(Result.unwrap(swapped)).toBe(error);
    });
  });
});
