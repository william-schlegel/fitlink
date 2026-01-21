"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
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
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="text-error mb-4">
            <AlertTriangle className="h-16 w-16" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
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
        </CardContent>
        <CardFooter className="justify-center gap-2">
          <Button onClick={onReset}>Try Again</Button>
          <Button variant="ghost" onClick={() => (window.location.href = "/")}>
            Go Home
          </Button>
        </CardFooter>
      </Card>
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
