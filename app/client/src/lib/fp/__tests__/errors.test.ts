/**
 * Tests for AppError type
 */
import { describe, it, expect } from 'vitest';
import { AppError, isAppError, getUserMessage } from '../errors';

describe('AppError', () => {
  describe('factory functions', () => {
    it('creates validation error', () => {
      const error = AppError.validation('Invalid input', { field: 'email' });
      expect(error.kind).toBe('validation');
      expect(error.message).toBe('Invalid input');
      expect(error.context).toEqual({ field: 'email' });
    });

    it('creates not-found error', () => {
      const error = AppError.notFound('Project not found', { id: '123' });
      expect(error.kind).toBe('not-found');
      expect(error.message).toBe('Project not found');
      expect(error.context).toEqual({ id: '123' });
    });

    it('creates authentication error', () => {
      const error = AppError.authentication('Session expired');
      expect(error.kind).toBe('authentication');
      expect(error.message).toBe('Session expired');
    });

    it('creates authorization error', () => {
      const error = AppError.authorization('Access denied');
      expect(error.kind).toBe('authorization');
      expect(error.message).toBe('Access denied');
    });

    it('creates rate-limit error', () => {
      const error = AppError.rateLimit('Too many requests');
      expect(error.kind).toBe('rate-limit');
      expect(error.message).toBe('Too many requests');
    });

    it('creates database error', () => {
      const originalError = new Error('Connection failed');
      const error = AppError.database('Query failed', {}, originalError);
      expect(error.kind).toBe('database');
      expect(error.message).toBe('Query failed');
      expect(error.cause).toBe(originalError);
    });

    it('creates network error', () => {
      const error = AppError.network('Connection refused');
      expect(error.kind).toBe('network');
      expect(error.message).toBe('Connection refused');
    });

    it('creates service-unavailable error', () => {
      const error = AppError.serviceUnavailable('AI service down');
      expect(error.kind).toBe('service-unavailable');
      expect(error.message).toBe('AI service down');
    });

    it('creates internal error', () => {
      const error = AppError.internal('Unexpected state');
      expect(error.kind).toBe('internal');
      expect(error.message).toBe('Unexpected state');
    });
  });

  describe('constructor function', () => {
    it('creates error with all fields', () => {
      const cause = new Error('Original');
      const error = AppError('validation', 'Test error', { key: 'value' }, cause);
      expect(error.kind).toBe('validation');
      expect(error.message).toBe('Test error');
      expect(error.context).toEqual({ key: 'value' });
      expect(error.cause).toBe(cause);
    });

    it('creates error without optional fields', () => {
      const error = AppError('not-found', 'Missing');
      expect(error.kind).toBe('not-found');
      expect(error.message).toBe('Missing');
      expect(error.context).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });
  });
});

describe('isAppError', () => {
  it('returns true for AppError objects', () => {
    const error = AppError.validation('Test');
    expect(isAppError(error)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isAppError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAppError(undefined)).toBe(false);
  });

  it('returns false for plain objects', () => {
    expect(isAppError({})).toBe(false);
  });

  it('returns false for Error objects', () => {
    expect(isAppError(new Error('Test'))).toBe(false);
  });

  it('returns true for objects with kind and message', () => {
    const errorLike = { kind: 'validation', message: 'Test' };
    expect(isAppError(errorLike)).toBe(true);
  });
});

describe('getUserMessage', () => {
  it('returns user-friendly validation message', () => {
    const error = AppError.validation('Invalid email');
    expect(getUserMessage(error)).toBe('Validation error: Invalid email');
  });

  it('returns user-friendly not-found message', () => {
    const error = AppError.notFound('Project 123');
    expect(getUserMessage(error)).toBe('Not found: Project 123');
  });

  it('returns generic authentication message', () => {
    const error = AppError.authentication('Token expired');
    expect(getUserMessage(error)).toBe('Please log in to continue.');
  });

  it('returns generic authorization message', () => {
    const error = AppError.authorization('Not admin');
    expect(getUserMessage(error)).toBe(
      "You don't have permission to perform this action."
    );
  });

  it('returns generic rate-limit message', () => {
    const error = AppError.rateLimit('100 requests/min');
    expect(getUserMessage(error)).toBe('Too many requests. Please try again later.');
  });

  it('returns generic database message', () => {
    const error = AppError.database('Connection timeout');
    expect(getUserMessage(error)).toBe(
      'A database error occurred. Please try again.'
    );
  });

  it('returns generic network message', () => {
    const error = AppError.network('DNS failure');
    expect(getUserMessage(error)).toBe(
      'A network error occurred. Please check your connection.'
    );
  });

  it('returns generic service-unavailable message', () => {
    const error = AppError.serviceUnavailable('Maintenance');
    expect(getUserMessage(error)).toBe(
      'Service temporarily unavailable. Please try again later.'
    );
  });

  it('returns generic internal message', () => {
    const error = AppError.internal('Null pointer');
    expect(getUserMessage(error)).toBe(
      'An unexpected error occurred. Please try again.'
    );
  });
});
