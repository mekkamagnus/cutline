/**
 * Result<E, T> - A wrapper around fp-ts Either for error handling
 *
 * This module provides a facade over fp-ts/Either to prevent
 * direct fp-ts imports throughout the codebase.
 *
 * By convention, we use Result<AppError, T> throughout the app.
 */
import {
  Either,
  Left,
  Right,
  left,
  right,
  isLeft,
  isRight,
  match as eitherMatch,
  map as eitherMap,
  mapLeft as eitherMapLeft,
  chain as eitherChain,
  bimap as eitherBimap,
} from 'fp-ts/Either';

import { AppError } from './errors';

// Re-export the Either type as Result
export type Result<E, T> = Either<E, T>;

// Convenience type alias for our standard Result
export type AppResult<T> = Result<AppError, T>;

/**
 * Result namespace with all operations
 */
export const Result = {
  /**
   * Create an Ok (right) value
   */
  ok: <T, E = AppError>(value: T): Result<E, T> => right(value),

  /**
   * Create an Err (left) value
   */
  err: <E, T = never>(error: E): Result<E, T> => left(error),

  /**
   * Check if a Result is Ok
   */
  isOk: <E, T>(result: Result<E, T>): result is Right<T> => isRight(result),

  /**
   * Check if a Result is Err
   */
  isErr: <E, T>(result: Result<E, T>): result is Left<E> => isLeft(result),

  /**
   * Map over a Result's success value
   */
  map: <A, B, E>(f: (a: A) => B) => (result: Result<E, A>): Result<E, B> =>
    eitherMap(f)(result),

  /**
   * Map over a Result's error value
   */
  mapErr: <E, F, T>(f: (e: E) => F) => (result: Result<E, T>): Result<F, T> =>
    eitherMapLeft(f)(result),

  /**
   * Map over both success and error values
   */
  bimap: <E, F, A, B>(
    onErr: (e: E) => F,
    onOk: (a: A) => B
  ) => (result: Result<E, A>): Result<F, B> => eitherBimap(onErr, onOk)(result),

  /**
   * FlatMap over a Result's success value
   */
  flatMap: <A, B, E>(f: (a: A) => Result<E, B>) => (result: Result<E, A>): Result<E, B> =>
    eitherChain(f)(result),

  /**
   * Alias for flatMap (common naming convention)
   */
  andThen: <A, B, E>(f: (a: A) => Result<E, B>) => (result: Result<E, A>): Result<E, B> =>
    eitherChain(f)(result),

  /**
   * Get the success value or a default
   */
  unwrapOr: <T, E>(defaultValue: T, result: Result<E, T>): T =>
    isLeft(result) ? defaultValue : result.right,

  /**
   * Get the success value or throw
   */
  unwrap: <E, T>(result: Result<E, T>): T => {
    if (isLeft(result)) {
      throw result.left;
    }
    return result.right;
  },

  /**
   * Get the error value or a default
   */
  unwrapErrorOr: <E, T, D>(defaultValue: D, result: Result<E, T>): E | D =>
    isLeft(result) ? result.left : defaultValue,

  /**
   * Get the error value or throw
   */
  unwrapError: <E, T>(result: Result<E, T>): E => {
    if (isRight(result)) {
      throw new Error('Called unwrapError on Ok');
    }
    return result.left;
  },

  /**
   * Pattern match on a Result
   */
  match: <E, T, R>(
    onErr: (error: E) => R,
    onOk: (value: T) => R
  ) => (result: Result<E, T>): R => eitherMatch(onErr, onOk)(result),

  /**
   * Wrap a function that might throw in a Result
   */
  tryCatch: <T, E = Error>(
    f: () => T,
    onError: (error: unknown) => E
  ): Result<E, T> => {
    try {
      return right(f());
    } catch (error) {
      return left(onError(error));
    }
  },

  /**
   * Wrap an async function that might throw in a Promise<Result>
   */
  tryCatchAsync: async <T, E = Error>(
    f: () => Promise<T>,
    onError: (error: unknown) => E
  ): Promise<Result<E, T>> => {
    try {
      const value = await f();
      return right(value);
    } catch (error) {
      return left(onError(error));
    }
  },

  /**
   * Convert a Result to an Option (success value only)
   */
  toOption: <E, T>(result: Result<E, T>): { _tag: 'Some'; value: T } | { _tag: 'None' } =>
    isLeft(result) ? { _tag: 'None' } : { _tag: 'Some', value: result.right },

  /**
   * Combine two Results, returning the first error if either fails
   */
  zip: <E, A, B>(
    resultA: Result<E, A>,
    resultB: Result<E, B>
  ): Result<E, [A, B]> => {
    if (isLeft(resultA)) return resultA;
    if (isLeft(resultB)) return resultB;
    return right([resultA.right, resultB.right]);
  },

  /**
   * Combine an array of Results into a Result of array
   */
  sequence: <E, T>(results: Result<E, T>[]): Result<E, T[]> => {
    const values: T[] = [];
    for (const result of results) {
      if (isLeft(result)) {
        return result;
      }
      values.push(result.right);
    }
    return right(values);
  },

  /**
   * Swap the error and success values
   */
  swap: <E, T>(result: Result<E, T>): Result<T, E> =>
    isLeft(result) ? right(result.left) : left(result.right),
};
