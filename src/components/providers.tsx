"use client";

import type { ReactNode } from "react";

import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorProvider } from "@/lib/errors/context";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper
 * Combines ErrorProvider and ErrorBoundary for global error handling
 */
export function ErrorProviders({ children }: ProvidersProps) {
  return (
    <ErrorProvider>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ErrorProvider>
  );
}

export default ErrorProviders;
