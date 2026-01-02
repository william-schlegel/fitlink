/**
 * Centralized Error Logger Service
 * Extensible architecture for logging to console, Sentry, or other services
 */

import { AppError, isAppError, type ErrorSeverity } from "./index";

// Log levels matching severity
export type LogLevel = "debug" | "info" | "warn" | "error";

// Log entry structure
export interface LogEntry {
  level: LogLevel;
  message: string;
  error?: AppError | Error;
  context?: Record<string, unknown>;
  timestamp: Date;
  environment: string;
}

// Logger configuration
export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  // Extend this for Sentry or other services
  remoteEndpoint?: string;
  onLog?: (entry: LogEntry) => void;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === "production" ? "warn" : "debug",
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === "production",
};

// Log level priority for filtering
const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Map severity to log level
const severityToLogLevel: Record<ErrorSeverity, LogLevel> = {
  low: "info",
  medium: "warn",
  high: "error",
  critical: "error",
};

class ErrorLogger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if a log level should be logged based on minimum level
   */
  private shouldLog(level: LogLevel): boolean {
    return levelPriority[level] >= levelPriority[this.config.minLevel];
  }

  /**
   * Format error for logging
   */
  private formatError(error: unknown): Record<string, unknown> {
    if (isAppError(error)) {
      return error.toJSON();
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return { value: String(error) };
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: unknown,
    context?: Record<string, unknown>,
  ): LogEntry {
    return {
      level,
      message,
      error: error instanceof Error ? error : undefined,
      context: {
        ...context,
        errorDetails: error ? this.formatError(error) : undefined,
      },
      timestamp: new Date(),
      environment: process.env.NODE_ENV ?? "development",
    };
  }

  /**
   * Log to console with appropriate styling
   */
  private logToConsole(entry: LogEntry) {
    if (!this.config.enableConsole) return;

    const prefix = `[${entry.timestamp.toISOString()}] [${entry.level.toUpperCase()}]`;
    const style = this.getConsoleStyle(entry.level);

    switch (entry.level) {
      case "debug":
        console.debug(style, prefix, entry.message, entry.context);
        break;
      case "info":
        console.info(style, prefix, entry.message, entry.context);
        break;
      case "warn":
        console.warn(style, prefix, entry.message, entry.context);
        break;
      case "error":
        console.error(style, prefix, entry.message, entry.context);
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  /**
   * Get console styling for different log levels
   */
  private getConsoleStyle(level: LogLevel): string {
    // In Node.js environment, we use empty string (no styling)
    // In browser, we could use CSS styling
    if (typeof window === "undefined") {
      return "";
    }

    const styles: Record<LogLevel, string> = {
      debug: "color: gray",
      info: "color: blue",
      warn: "color: orange",
      error: "color: red; font-weight: bold",
    };

    return styles[level];
  }

  /**
   * Send log to remote service (Sentry, custom endpoint, etc.)
   * This is a placeholder that can be extended for actual service integration
   */
  private async logToRemote(entry: LogEntry) {
    if (!this.config.enableRemote) return;

    // Placeholder for Sentry integration:
    // if (typeof Sentry !== 'undefined') {
    //   if (entry.level === 'error' && entry.error) {
    //     Sentry.captureException(entry.error, {
    //       extra: entry.context,
    //       level: entry.level,
    //     });
    //   } else {
    //     Sentry.captureMessage(entry.message, {
    //       extra: entry.context,
    //       level: entry.level,
    //     });
    //   }
    // }

    // Custom endpoint logging:
    if (this.config.remoteEndpoint) {
      try {
        await fetch(this.config.remoteEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...entry,
            error: entry.error ? this.formatError(entry.error) : undefined,
          }),
        });
      } catch {
        // Silently fail remote logging to avoid cascading errors
        console.error("Failed to send log to remote endpoint");
      }
    }
  }

  /**
   * Main logging method
   */
  private log(
    level: LogLevel,
    message: string,
    error?: unknown,
    context?: Record<string, unknown>,
  ) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, error, context);

    this.logToConsole(entry);
    this.logToRemote(entry);

    // Call custom log handler if provided
    if (this.config.onLog) {
      this.config.onLog(entry);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, undefined, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, undefined, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, error?: unknown, context?: Record<string, unknown>) {
    this.log("warn", message, error, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    this.log("error", message, error, context);
  }

  /**
   * Log an AppError with appropriate level based on severity
   */
  logAppError(error: AppError, additionalContext?: Record<string, unknown>) {
    const level = severityToLogLevel[error.severity];
    this.log(level, error.message, error, {
      ...error.context,
      ...additionalContext,
    });
  }

  /**
   * Log any error, converting to AppError if needed
   */
  logError(error: unknown, context?: Record<string, unknown>) {
    const appError = AppError.fromUnknown(error);
    this.logAppError(appError, context);
  }
}

// Singleton logger instance
export const logger = new ErrorLogger();

// Export for testing or custom instances
export { ErrorLogger };
