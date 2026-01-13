"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import React, { useState, useCallback } from "react";
import superjson from "superjson";

import { AppError, ErrorCode, NetworkError, AuthError } from "@/lib/errors";
import { logger } from "@/lib/errors/logger";
import { toast } from "sonner";

import { trpc } from "./client";

/**
 * Convert tRPC errors to AppError instances
 */
function convertTRPCError(error: unknown): AppError {
  if (error instanceof TRPCClientError) {
    const code = error.data?.code;

    // Handle specific tRPC error codes
    switch (code) {
      case "UNAUTHORIZED":
        return new AuthError({
          message: error.message,
          code: ErrorCode.UNAUTHORIZED,
          userMessage: "You need to sign in to access this resource.",
        });
      case "FORBIDDEN":
        return new AuthError({
          message: error.message,
          code: ErrorCode.ACCESS_DENIED,
          userMessage: "You do not have permission to perform this action.",
        });
      case "NOT_FOUND":
        return new AppError({
          message: error.message,
          code: ErrorCode.NOT_FOUND,
          severity: "low",
          userMessage: "The requested resource was not found.",
        });
      case "BAD_REQUEST":
        return new AppError({
          message: error.message,
          code: ErrorCode.VALIDATION_FAILED,
          severity: "low",
          userMessage:
            error.message || "Invalid request. Please check your input.",
        });
      case "TIMEOUT":
        return new NetworkError({
          message: error.message,
          userMessage: "Request timed out. Please try again.",
        });
      case "INTERNAL_SERVER_ERROR":
        return new AppError({
          message: error.message,
          code: ErrorCode.UNEXPECTED,
          severity: "high",
          userMessage: "An unexpected error occurred. Please try again later.",
        });
      default:
        return new AppError({
          message: error.message,
          code: ErrorCode.API_ERROR,
          severity: "medium",
          userMessage: error.message || "An error occurred. Please try again.",
        });
    }
  }

  return AppError.fromUnknown(error);
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  /**
   * Global error handler for React Query / tRPC
   */
  const handleGlobalError = useCallback((error: unknown) => {
    const appError = convertTRPCError(error);

    // Log the error
    logger.logAppError(appError, { source: "tRPC" });

    // Show toast notification for user-facing errors
    if (appError.isOperational) {
      toast.error(appError.userMessage, "Error");
    }
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Retry logic
            retry: (failureCount, error) => {
              // Don't retry on auth errors
              if (error instanceof TRPCClientError) {
                const code = error.data?.code;
                if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
                  return false;
                }
              }
              return failureCount < 2;
            },
            // Stale time
            staleTime: 1000 * 60, // 1 minute
          },
          mutations: {
            // Global mutation error handler
            onError: handleGlobalError,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
