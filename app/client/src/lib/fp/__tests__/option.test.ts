/**
 * Tests for Option<T> type
 */
import { describe, it, expect } from 'vitest';
import { Option } from '../option';

describe('Option', () => {
  describe('some', () => {
    it('creates a Some value', () => {
      const option = Option.some(42);
      expect(Option.isSome(option)).toBe(true);
      expect(Option.unwrap(option)).toBe(42);
    });
  });

  describe('none', () => {
    it('creates a None value', () => {
      const option = Option.none();
      expect(Option.isNone(option)).toBe(true);
    });
  });

  describe('fromNullable', () => {
    it('creates Some for non-null values', () => {
      const option = Option.fromNullable('hello');
      expect(Option.isSome(option)).toBe(true);
      expect(Option.unwrap(option)).toBe('hello');
    });

    it('creates None for null', () => {
      const option = Option.fromNullable(null);
      expect(Option.isNone(option)).toBe(true);
    });

    it('creates None for undefined', () => {
      const option = Option.fromNullable(undefined);
      expect(Option.isNone(option)).toBe(true);
    });
  });

  describe('map', () => {
    it('transforms the value in Some', () => {
      const option = Option.some(5);
      const mapped = Option.map((x: number) => x * 2)(option);
      expect(Option.unwrap(mapped)).toBe(10);
    });

    it('returns None for None', () => {
      const option = Option.none<number>();
      const mapped = Option.map((x: number) => x * 2)(option);
      expect(Option.isNone(mapped)).toBe(true);
    });
  });

  describe('flatMap', () => {
    it('chains operations for Some', () => {
      const option = Option.some(5);
      const result = Option.flatMap((x: number) =>
        x > 0 ? Option.some(x * 2) : Option.none()
      )(option);
      expect(Option.isSome(result)).toBe(true);
      expect(Option.unwrap(result)).toBe(10);
    });

    it('returns None when chained operation returns None', () => {
      const option = Option.some(5);
      const result = Option.flatMap((x: number) =>
        x < 0 ? Option.some(x * 2) : Option.none()
      )(option);
      expect(Option.isNone(result)).toBe(true);
    });

    it('returns None for None', () => {
      const option = Option.none<number>();
      const result = Option.flatMap((x: number) => Option.some(x * 2))(option);
      expect(Option.isNone(result)).toBe(true);
    });
  });

  describe('unwrapOr', () => {
    it('returns the value for Some', () => {
      const option = Option.some(42);
      expect(Option.unwrapOr(0)(option)).toBe(42);
    });

    it('returns the default for None', () => {
      const option = Option.none<number>();
      expect(Option.unwrapOr(0)(option)).toBe(0);
    });
  });

  describe('unwrap', () => {
    it('returns the value for Some', () => {
      const option = Option.some(42);
      expect(Option.unwrap(option)).toBe(42);
    });

    it('throws for None', () => {
      const option = Option.none();
      expect(() => Option.unwrap(option)).toThrow('Called unwrap on None');
    });
  });

  describe('getOrElse', () => {
    it('returns the value for Some', () => {
      const option = Option.some(42);
      expect(Option.getOrElse(() => 0)(option)).toBe(42);
    });

    it('calls the function for None', () => {
      const option = Option.none<number>();
      expect(Option.getOrElse(() => 99)(option)).toBe(99);
    });
  });

  describe('filter', () => {
    it('keeps the value if predicate passes', () => {
      const option = Option.some(5);
      const filtered = Option.filter((x: number) => x > 0)(option);
      expect(Option.isSome(filtered)).toBe(true);
      expect(Option.unwrap(filtered)).toBe(5);
    });

    it('returns None if predicate fails', () => {
      const option = Option.some(5);
      const filtered = Option.filter((x: number) => x < 0)(option);
      expect(Option.isNone(filtered)).toBe(true);
    });

    it('returns None for None', () => {
      const option = Option.none<number>();
      const filtered = Option.filter((x: number) => x > 0)(option);
      expect(Option.isNone(filtered)).toBe(true);
    });
  });

  describe('match', () => {
    it('calls onSome for Some', () => {
      const option = Option.some(42);
      const result = Option.match(
        () => 'none',
        (x: number) => `some: ${x}`
      )(option);
      expect(result).toBe('some: 42');
    });

    it('calls onNone for None', () => {
      const option = Option.none<number>();
      const result = Option.match(
        () => 'none',
        (x: number) => `some: ${x}`
      )(option);
      expect(result).toBe('none');
    });
  });

  describe('toNullable', () => {
    it('returns the value for Some', () => {
      const option = Option.some(42);
      expect(Option.toNullable(option)).toBe(42);
    });

    it('returns null for None', () => {
      const option = Option.none();
      expect(Option.toNullable(option)).toBeNull();
    });
  });

  describe('toUndefined', () => {
    it('returns the value for Some', () => {
      const option = Option.some(42);
      expect(Option.toUndefined(option)).toBe(42);
    });

    it('returns undefined for None', () => {
      const option = Option.none();
      expect(Option.toUndefined(option)).toBeUndefined();
    });
  });

  describe('zip', () => {
    it('combines two Some values', () => {
      const a = Option.some(1);
      const b = Option.some(2);
      const zipped = Option.zip(a, b);
      expect(Option.isSome(zipped)).toBe(true);
      expect(Option.unwrap(zipped)).toEqual([1, 2]);
    });

    it('returns None if first is None', () => {
      const a = Option.none<number>();
      const b = Option.some(2);
      const zipped = Option.zip(a, b);
      expect(Option.isNone(zipped)).toBe(true);
    });

    it('returns None if second is None', () => {
      const a = Option.some(1);
      const b = Option.none<number>();
      const zipped = Option.zip(a, b);
      expect(Option.isNone(zipped)).toBe(true);
    });
  });

  describe('equals', () => {
    it('returns true for equal Some values', () => {
      const a = Option.some(42);
      const b = Option.some(42);
      expect(Option.equals(a, b)).toBe(true);
    });

    it('returns false for different Some values', () => {
      const a = Option.some(42);
      const b = Option.some(43);
      expect(Option.equals(a, b)).toBe(false);
    });

    it('returns true for two None values', () => {
      const a = Option.none();
      const b = Option.none();
      expect(Option.equals(a, b)).toBe(true);
    });

    it('returns false for Some and None', () => {
      const a = Option.some(42);
      const b = Option.none();
      expect(Option.equals(a, b)).toBe(false);
    });
  });
});
