/**
 * Option<T> - A wrapper around fp-ts Option for nullable values
 *
 * This module provides a facade over fp-ts/Option to prevent
 * direct fp-ts imports throughout the codebase.
 */
import { Option as FpOption, none, some, isNone, isSome, match } from 'fp-ts/Option';

export type Option<T> = FpOption<T>;

/**
 * Option namespace with all operations
 */
export const Option = {
  /**
   * Create a Some value
   */
  some: <T>(value: T): Option<T> => some(value),

  /**
   * Create a None value
   */
  none: <T = never>(): Option<T> => none,

  /**
   * Create an Option from a nullable value
   */
  fromNullable: <T>(value: T | null | undefined): Option<T> =>
    value == null ? none : some(value),

  /**
   * Check if an Option is Some
   */
  isSome: <T>(option: Option<T>): option is { _tag: 'Some'; value: T } => isSome(option),

  /**
   * Check if an Option is None
   */
  isNone: <T>(option: Option<T>): option is { _tag: 'None' } => isNone(option),

  /**
   * Map over an Option's value
   */
  map: <A, B>(f: (a: A) => B) => (option: Option<A>): Option<B> =>
    isNone(option) ? none : some(f(option.value)),

  /**
   * FlatMap over an Option's value
   */
  flatMap: <A, B>(f: (a: A) => Option<B>) => (option: Option<A>): Option<B> =>
    isNone(option) ? none : f(option.value),

  /**
   * Get the value or a default
   */
  unwrapOr: <T>(defaultValue: T) => (option: Option<T>): T =>
    match(() => defaultValue, (value: T) => value)(option),

  /**
   * Get the value or throw
   */
  unwrap: <T>(option: Option<T>): T => {
    if (isNone(option)) {
      throw new Error('Called unwrap on None');
    }
    return option.value;
  },

  /**
   * Get the value or compute it from a function
   */
  getOrElse: <T>(f: () => T) => (option: Option<T>): T =>
    match(f, (value: T) => value)(option),

  /**
   * Filter an Option based on a predicate
   */
  filter: <T>(predicate: (value: T) => boolean) => (option: Option<T>): Option<T> =>
    isNone(option) ? none : predicate(option.value) ? option : none,

  /**
   * Pattern match on an Option
   */
  match: <T, R>(onNone: () => R, onSome: (value: T) => R) => (option: Option<T>): R =>
    match(onNone, onSome)(option),

  /**
   * Convert an Option to a nullable value
   */
  toNullable: <T>(option: Option<T>): T | null =>
    isNone(option) ? null : option.value,

  /**
   * Convert an Option to undefined
   */
  toUndefined: <T>(option: Option<T>): T | undefined =>
    isNone(option) ? undefined : option.value,

  /**
   * Combine two Options, returning None if either is None
   */
  zip: <A, B>(optionA: Option<A>, optionB: Option<B>): Option<[A, B]> =>
    isNone(optionA) || isNone(optionB)
      ? none
      : some([optionA.value, optionB.value]),

  /**
   * Apply a function in an Option to a value in an Option
   */
  ap: <A, B>(fab: Option<(a: A) => B>, fa: Option<A>): Option<B> =>
    isNone(fab) || isNone(fa) ? none : some(fab.value(fa.value)),

  /**
   * Check if two Options are equal
   */
  equals: <T>(a: Option<T>, b: Option<T>, eq = (x: T, y: T) => x === y): boolean =>
    isNone(a) && isNone(b)
      ? true
      : isNone(a) || isNone(b)
        ? false
        : eq(a.value, b.value),
};
