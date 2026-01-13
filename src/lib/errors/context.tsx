"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { toast } from "sonner";

import { AppError, isAppError, type ErrorSeverity } from "./index";
import { logger } from "./logger";

// Error handler options
interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  severity?: ErrorSeverity;
  userMessage?: string;
}

// Error context value
interface ErrorContextValue {
  /**
   * Report an error to the global error handler
   * Automatically logs and shows toast based on options
   */
  reportError: (error: unknown, options?: ErrorHandlerOptions) => void;

  /**
   * Handle an error silently (log only, no toast)
   */
  handleSilently: (error: unknown) => void;

  /**
   * Show an error toast without logging
   */
  showError: (message: string, title?: string) => void;

  /**
   * Clear any displayed errors
   */
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

/**
 * Error Provider component
 * Provides global error handling capabilities to the application
 */
export function ErrorProvider({ children }: { children: ReactNode }) {
  /**
   * Show error toast based on severity
   */
  const showErrorToast = useCallback(
    (appError: AppError, customMessage?: string) => {
      const message = customMessage ?? appError.userMessage;
      const title = getErrorTitle(appError.severity);
      toast.error(title, { description: message });
    },
    [],
  );

  /**
   * Report an error with full handling
   */
  const reportError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        logError = true,
        severity,
        userMessage,
      } = options;

      // Convert to AppError
      let appError = isAppError(error) ? error : AppError.fromUnknown(error);

      // Override severity if provided
      if (severity) {
        appError = new AppError({
          message: appError.message,
          code: appError.code,
          severity,
          userMessage: userMessage ?? appError.userMessage,
          context: appError.context,
          originalError: appError.originalError,
        });
      }

      // Log the error
      if (logError) {
        logger.logAppError(appError);
      }

      // Show toast notification
      if (showToast) {
        showErrorToast(appError, userMessage);
      }
    },
    [showErrorToast],
  );

  /**
   * Handle error silently (log only)
   */
  const handleSilently = useCallback((error: unknown) => {
    const appError = isAppError(error) ? error : AppError.fromUnknown(error);
    logger.logAppError(appError);
  }, []);

  /**
   * Show an error message without logging
   */
  const showError = useCallback((message: string, title?: string) => {
    toast.error(title ?? "Error", { description: message });
  }, []);

  /**
   * Clear displayed errors
   * Note: The current toast implementation auto-dismisses,
   * but this could be extended for persistent error displays
   */
  const clearErrors = useCallback(() => {
    // Current toast auto-dismisses, this is a placeholder for future use
  }, []);

  const contextValue = useMemo<ErrorContextValue>(
    () => ({
      reportError,
      handleSilently,
      showError,
      clearErrors,
    }),
    [reportError, handleSilently, showError, clearErrors],
  );

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
}

/**
 * Hook to access error handling functions
 */
export function useError(): ErrorContextValue {
  const context = useContext(ErrorContext);

  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }

  return context;
}

/**
 * Get appropriate title based on error severity
 */
function getErrorTitle(severity: ErrorSeverity): string {
  switch (severity) {
    case "low":
      return "Notice";
    case "medium":
      return "Warning";
    case "high":
      return "Error";
    case "critical":
      return "Critical Error";
    default:
      return "Error";
  }
}

/**
 * HOC to wrap a component with error handling
 */
export function withErrorHandler<P extends object>(
  WrappedComponent: React.ComponentType<P>,
) {
  return function WithErrorHandlerComponent(props: P) {
    return (
      <ErrorProvider>
        <WrappedComponent {...props} />
      </ErrorProvider>
    );
  };
}

export default ErrorProvider;
