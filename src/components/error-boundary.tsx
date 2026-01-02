"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { AppError, isAppError } from "@/lib/errors";
import { logger } from "@/lib/errors/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

/**
 * React Error Boundary component
 * Catches rendering errors in the component tree and displays a fallback UI
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Convert to AppError for consistent handling
    const appError = isAppError(error) ? error : AppError.fromUnknown(error);
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Convert to AppError
    const appError = isAppError(error) ? error : AppError.fromUnknown(error);

    // Log the error
    logger.logAppError(appError, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback error={this.state.error} onReset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI component
 */
interface ErrorFallbackProps {
  error: AppError | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="card bg-base-100 w-full max-w-md shadow-xl">
        <div className="card-body items-center text-center">
          {/* Error Icon */}
          <div className="text-error mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="card-title text-xl">Something went wrong</h2>

          <p className="text-base-content/70">
            {error?.userMessage ??
              "An unexpected error occurred. Please try again."}
          </p>

          {/* Error code for debugging */}
          {error?.code && (
            <p className="text-base-content/50 mt-2 text-xs font-mono">
              Error Code: {error.code}
            </p>
          )}

          <div className="card-actions mt-6">
            <button onClick={onReset} className="btn btn-primary">
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="btn btn-ghost"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper component for easier use in layouts
 */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default ErrorBoundary;

