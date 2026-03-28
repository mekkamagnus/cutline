/**
 * FP Facade - Public API
 *
 * This is the ONLY place that should export fp-ts functionality.
 * All other code in the application should import from this module,
 * never directly from 'fp-ts'.
 *
 * Usage:
 * ```typescript
 * import { Option, Result, AsyncResult, AppError } from '@/lib/fp';
 *
 * // Option for nullable values
 * const value = Option.fromNullable(nullableValue)
 *   .map(x => x.transformed)
 *   .unwrapOr(defaultValue);
 *
 * // Result for fallible operations
 * const parsed = Result.tryCatch(
 *   () => JSON.parse(input),
 *   (e) => AppError.validation('Invalid JSON', {}, e)
 * );
 *
 * // AsyncResult for async operations
 * const result = await service
 *   .doSomething(data)
 *   .andThen(result => anotherService.process(result))
 *   .run(); // Execute only at edge!
 * ```
 */

// Re-export modules (these include the types)
export { Option } from './option';
export type { Option as OptionType } from './option';

export { Result } from './result';
export type { Result as ResultType, AppResult } from './result';

export { AsyncResult } from './async-result';
export type { AsyncResult as AsyncResultType, AppAsyncResult } from './async-result';

export { AppError, isAppError, getUserMessage } from './errors';
export type { AppError as AppErrorType, AppErrorKind } from './errors';
