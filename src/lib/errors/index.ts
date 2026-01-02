/**
 * Global Error Management System
 * Custom error classes with error codes, severity levels, and user-friendly messages
 */

// Error severity levels
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

// Error codes for categorization
export const ErrorCode = {
  // General errors (1000-1999)
  UNKNOWN: "ERR_1000",
  UNEXPECTED: "ERR_1001",

  // Validation errors (2000-2999)
  VALIDATION_FAILED: "ERR_2000",
  INVALID_INPUT: "ERR_2001",
  MISSING_REQUIRED_FIELD: "ERR_2002",
  INVALID_FORMAT: "ERR_2003",

  // Authentication errors (3000-3999)
  UNAUTHORIZED: "ERR_3000",
  SESSION_EXPIRED: "ERR_3001",
  INVALID_CREDENTIALS: "ERR_3002",
  ACCESS_DENIED: "ERR_3003",

  // Network errors (4000-4999)
  NETWORK_ERROR: "ERR_4000",
  TIMEOUT: "ERR_4001",
  SERVICE_UNAVAILABLE: "ERR_4002",
  API_ERROR: "ERR_4003",

  // Database errors (5000-5999)
  DATABASE_ERROR: "ERR_5000",
  NOT_FOUND: "ERR_5001",
  DUPLICATE_ENTRY: "ERR_5002",
  CONSTRAINT_VIOLATION: "ERR_5003",

  // Business logic errors (6000-6999)
  BUSINESS_RULE_VIOLATION: "ERR_6000",
  INSUFFICIENT_PERMISSIONS: "ERR_6001",
  OPERATION_NOT_ALLOWED: "ERR_6002",
  RESOURCE_LIMIT_EXCEEDED: "ERR_6003",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// Error context for additional information
export interface ErrorContext {
  userId?: string;
  route?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly context: ErrorContext;
  public readonly originalError?: Error;
  public readonly isOperational: boolean;

  constructor(options: {
    message: string;
    code?: ErrorCodeType;
    severity?: ErrorSeverity;
    userMessage?: string;
    context?: ErrorContext;
    originalError?: Error;
    isOperational?: boolean;
  }) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code ?? ErrorCode.UNKNOWN;
    this.severity = options.severity ?? "medium";
    this.userMessage =
      options.userMessage ?? "An unexpected error occurred. Please try again.";
    this.context = {
      ...options.context,
      timestamp: options.context?.timestamp ?? new Date(),
    };
    this.originalError = options.originalError;
    this.isOperational = options.isOperational ?? true;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to a plain object for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      userMessage: this.userMessage,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }

  /**
   * Create an AppError from an unknown error
   */
  static fromUnknown(
    error: unknown,
    defaultMessage = "An unexpected error occurred",
  ): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError({
        message: error.message,
        code: ErrorCode.UNEXPECTED,
        severity: "medium",
        userMessage: defaultMessage,
        originalError: error,
      });
    }

    return new AppError({
      message: typeof error === "string" ? error : defaultMessage,
      code: ErrorCode.UNKNOWN,
      severity: "medium",
      userMessage: defaultMessage,
    });
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(options: {
    message: string;
    fields?: Record<string, string[]>;
    userMessage?: string;
    context?: ErrorContext;
  }) {
    super({
      message: options.message,
      code: ErrorCode.VALIDATION_FAILED,
      severity: "low",
      userMessage:
        options.userMessage ?? "Please check your input and try again.",
      context: options.context,
      isOperational: true,
    });
    this.name = "ValidationError";
    this.fields = options.fields;
  }
}

/**
 * Authentication error for auth-related failures
 */
export class AuthError extends AppError {
  constructor(options: {
    message: string;
    code?: ErrorCodeType;
    userMessage?: string;
    context?: ErrorContext;
  }) {
    super({
      message: options.message,
      code: options.code ?? ErrorCode.UNAUTHORIZED,
      severity: "medium",
      userMessage:
        options.userMessage ?? "Authentication failed. Please sign in again.",
      context: options.context,
      isOperational: true,
    });
    this.name = "AuthError";
  }
}

/**
 * Network error for API/network failures
 */
export class NetworkError extends AppError {
  public readonly statusCode?: number;

  constructor(options: {
    message: string;
    statusCode?: number;
    userMessage?: string;
    context?: ErrorContext;
    originalError?: Error;
  }) {
    super({
      message: options.message,
      code: ErrorCode.NETWORK_ERROR,
      severity: "medium",
      userMessage:
        options.userMessage ??
        "Unable to connect to the server. Please check your connection.",
      context: options.context,
      originalError: options.originalError,
      isOperational: true,
    });
    this.name = "NetworkError";
    this.statusCode = options.statusCode;
  }
}

/**
 * Database error for database-related failures
 */
export class DatabaseError extends AppError {
  constructor(options: {
    message: string;
    code?: ErrorCodeType;
    userMessage?: string;
    context?: ErrorContext;
    originalError?: Error;
  }) {
    super({
      message: options.message,
      code: options.code ?? ErrorCode.DATABASE_ERROR,
      severity: "high",
      userMessage:
        options.userMessage ??
        "A database error occurred. Please try again later.",
      context: options.context,
      originalError: options.originalError,
      isOperational: true,
    });
    this.name = "DatabaseError";
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  public readonly resourceType?: string;
  public readonly resourceId?: string;

  constructor(options: {
    message: string;
    resourceType?: string;
    resourceId?: string;
    userMessage?: string;
    context?: ErrorContext;
  }) {
    super({
      message: options.message,
      code: ErrorCode.NOT_FOUND,
      severity: "low",
      userMessage:
        options.userMessage ?? "The requested resource was not found.",
      context: options.context,
      isOperational: true,
    });
    this.name = "NotFoundError";
    this.resourceType = options.resourceType;
    this.resourceId = options.resourceId;
  }
}

/**
 * Business logic error for domain rule violations
 */
export class BusinessError extends AppError {
  constructor(options: {
    message: string;
    code?: ErrorCodeType;
    userMessage?: string;
    context?: ErrorContext;
  }) {
    super({
      message: options.message,
      code: options.code ?? ErrorCode.BUSINESS_RULE_VIOLATION,
      severity: "medium",
      userMessage: options.userMessage ?? "This operation cannot be completed.",
      context: options.context,
      isOperational: true,
    });
    this.name = "BusinessError";
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is operational (expected) vs programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
