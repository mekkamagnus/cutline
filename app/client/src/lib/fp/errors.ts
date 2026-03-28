/**
 * AppError - Unified Error Domain
 *
 * All errors in the application are represented as AppError.
 * This provides a consistent error handling pattern across the codebase.
 */

export type AppErrorKind =
  | 'validation'
  | 'not-found'
  | 'authentication'
  | 'authorization'
  | 'rate-limit'
  | 'database'
  | 'network'
  | 'service-unavailable'
  | 'internal';

export interface AppError {
  readonly kind: AppErrorKind;
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly cause?: unknown;
}

/**
 * Create an AppError with proper typing
 */
export function AppError(
  kind: AppErrorKind,
  message: string,
  context?: Record<string, unknown>,
  cause?: unknown
): AppError {
  return { kind, message, context, cause };
}

/**
 * Factory functions for each error kind
 */
AppError.validation = (
  message: string,
  context?: Record<string, unknown>,
  cause?: unknown
): AppError => ({ kind: 'validation', message, context, cause });

AppError.notFound = (
  message: string,
  context?: Record<string, unknown>,
  cause?: unknown
): AppError => ({ kind: 'not-found', message, context, cause });

AppError.authentication = (
  message: string,
  context?: Record<string, unknown>,
  cause?: unknown
): AppError => ({ kind: 'authentication', message, context, cause });

AppError.authorization = (
  message: string,
  context?: Record<string, unknown>,
  cause?: unknown
): AppError => ({ kind: 'authorization', message, context, cause });

AppError.rateLimit = (
  message: string,
  context?: Record<string, unknown>,
  cause?: unknown
): AppError => ({ kind: 'rate-limit', message, context, cause });

AppError.database = (
  message: string,
  context?: Record<string, unknown>,
  cause?: unknown
): AppError => ({ kind: 'database', message, context, cause });

AppError.network = (
  message: string,
  context?: Record<string, unknown>,
  cause?: unknown
): AppError => ({ kind: 'network', message, context, cause });

AppError.serviceUnavailable = (
  message: string,
  context?: Record<string, unknown>,
  cause?: unknown
): AppError => ({ kind: 'service-unavailable', message, context, cause });

AppError.internal = (
  message: string,
  context?: Record<string, unknown>,
  cause?: unknown
): AppError => ({ kind: 'internal', message, context, cause });

/**
 * Type guard to check if something is an AppError
 */
export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    'message' in value
  );
}

/**
 * Get a user-friendly error message
 */
export function getUserMessage(error: AppError): string {
  switch (error.kind) {
    case 'validation':
      return `Validation error: ${error.message}`;
    case 'not-found':
      return `Not found: ${error.message}`;
    case 'authentication':
      return 'Please log in to continue.';
    case 'authorization':
      return "You don't have permission to perform this action.";
    case 'rate-limit':
      return 'Too many requests. Please try again later.';
    case 'database':
      return 'A database error occurred. Please try again.';
    case 'network':
      return 'A network error occurred. Please check your connection.';
    case 'service-unavailable':
      return 'Service temporarily unavailable. Please try again later.';
    case 'internal':
      return 'An unexpected error occurred. Please try again.';
    default:
      return 'An error occurred.';
  }
}
