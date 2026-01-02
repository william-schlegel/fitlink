/**
 * Error Handling Utilities
 * Wrappers and helpers for consistent error handling across the application
 */

import {
  AppError,
  isAppError,
  type ErrorCodeType,
  type ErrorContext,
  type ErrorSeverity,
} from "./index";
import { logger } from "./logger";

// Result type for tryCatch operations
export type Result<T, E = AppError> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

// Options for tryCatch wrapper
export interface TryCatchOptions {
  /** Default error message if the error doesn't have one */
  defaultMessage?: string;
  /** User-friendly message to display */
  userMessage?: string;
  /** Error code to use */
  code?: ErrorCodeType;
  /** Error severity */
  severity?: ErrorSeverity;
  /** Additional context */
  context?: ErrorContext;
  /** Whether to log the error */
  logError?: boolean;
  /** Whether to rethrow the error after handling */
  rethrow?: boolean;
}

/**
 * Async wrapper that catches errors and returns a Result type
 * Provides type-safe error handling without try/catch blocks
 *
 * @example
 * const result = await tryCatch(fetchUser(userId));
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.userMessage);
 * }
 */
export async function tryCatch<T>(
  promise: Promise<T>,
  options: TryCatchOptions = {},
): Promise<Result<T>> {
  try {
    const data = await promise;
    return { success: true, data };
  } catch (error) {
    const appError = createAppError(error, options);

    if (options.logError !== false) {
      logger.logAppError(
        appError,
        options.context ? { ...options.context } : undefined,
      );
    }

    if (options.rethrow) {
      throw appError;
    }

    return { success: false, error: appError };
  }
}

/**
 * Synchronous wrapper that catches errors and returns a Result type
 *
 * @example
 * const result = safeExecute(() => JSON.parse(data));
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.userMessage);
 * }
 */
export function safeExecute<T>(
  fn: () => T,
  options: TryCatchOptions = {},
): Result<T> {
  try {
    const data = fn();
    return { success: true, data };
  } catch (error) {
    const appError = createAppError(error, options);

    if (options.logError !== false) {
      logger.logAppError(
        appError,
        options.context ? { ...options.context } : undefined,
      );
    }

    if (options.rethrow) {
      throw appError;
    }

    return { success: false, error: appError };
  }
}

/**
 * Create an AppError from an unknown error with custom options
 */
function createAppError(error: unknown, options: TryCatchOptions): AppError {
  if (isAppError(error)) {
    // If already an AppError, optionally override some properties
    if (options.userMessage || options.severity || options.code) {
      return new AppError({
        message: error.message,
        code: options.code ?? error.code,
        severity: options.severity ?? error.severity,
        userMessage: options.userMessage ?? error.userMessage,
        context: { ...error.context, ...options.context },
        originalError: error.originalError,
      });
    }
    return error;
  }

  return new AppError({
    message:
      error instanceof Error
        ? error.message
        : (options.defaultMessage ?? "An unexpected error occurred"),
    code: options.code,
    severity: options.severity,
    userMessage: options.userMessage,
    context: options.context,
    originalError: error instanceof Error ? error : undefined,
  });
}

/**
 * Higher-order function that wraps an async function with error handling
 *
 * @example
 * const safeFetchUser = withErrorHandling(fetchUser, {
 *   userMessage: 'Failed to load user data',
 * });
 * const result = await safeFetchUser(userId);
 */
export function withErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: TryCatchOptions = {},
): (...args: TArgs) => Promise<Result<TReturn>> {
  return async (...args: TArgs): Promise<Result<TReturn>> => {
    return tryCatch(fn(...args), options);
  };
}

/**
 * Higher-order function that wraps a sync function with error handling
 */
export function withSyncErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options: TryCatchOptions = {},
): (...args: TArgs) => Result<TReturn> {
  return (...args: TArgs): Result<TReturn> => {
    return safeExecute(() => fn(...args), options);
  };
}

/**
 * Assert that a condition is true, throwing an AppError if not
 *
 * @example
 * assertCondition(user !== null, 'User not found', ErrorCode.NOT_FOUND);
 */
export function assertCondition(
  condition: boolean,
  message: string,
  code?: ErrorCodeType,
  userMessage?: string,
): asserts condition {
  if (!condition) {
    throw new AppError({
      message,
      code,
      userMessage,
      severity: "medium",
    });
  }
}

/**
 * Assert that a value is not null or undefined
 *
 * @example
 * const user = assertDefined(maybeUser, 'User not found');
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string,
  code?: ErrorCodeType,
): T {
  if (value === null || value === undefined) {
    throw new AppError({
      message,
      code,
      severity: "medium",
      userMessage: message,
    });
  }
  return value;
}

/**
 * Wrap a function to ensure it throws AppErrors instead of regular errors
 */
export function ensureAppError<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  return (...args: TArgs): TReturn => {
    try {
      const result = fn(...args);
      // Handle promises
      if (result instanceof Promise) {
        return result.catch((error) => {
          throw AppError.fromUnknown(error);
        }) as TReturn;
      }
      return result;
    } catch (error) {
      throw AppError.fromUnknown(error);
    }
  };
}

/**
 * Utility to safely parse JSON with error handling
 */
export function safeJsonParse<T>(
  json: string,
  options: TryCatchOptions = {},
): Result<T> {
  return safeExecute<T>(() => JSON.parse(json), {
    defaultMessage: "Failed to parse JSON",
    userMessage: "Invalid data format",
    ...options,
  });
}

/**
 * Utility to safely stringify JSON with error handling
 */
export function safeJsonStringify(
  value: unknown,
  options: TryCatchOptions = {},
): Result<string> {
  return safeExecute(() => JSON.stringify(value), {
    defaultMessage: "Failed to stringify JSON",
    userMessage: "Failed to process data",
    ...options,
  });
}
