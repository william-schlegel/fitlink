# Error Handling Guide

This document describes the global error management system implemented in the Fitlink application. It covers the architecture, available error classes, utilities, and best practices for consistent error handling.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Error Classes](#error-classes)
- [Error Codes](#error-codes)
- [Using the Error Context](#using-the-error-context)
- [Utility Functions](#utility-functions)
- [tRPC Error Handling](#trpc-error-handling)
- [Error Boundary](#error-boundary)
- [Logging](#logging)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Architecture Overview

The error handling system consists of several interconnected components:

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Application                               │
├─────────────────────────────────────────────────────────────────┤
│  ErrorProvider (Context)                                         │
│  ├── ErrorBoundary (Catches render errors)                      │
│  │   ├── ConvexClientProvider                                   │
│  │   │   └── TRPCProvider (Global mutation error handler)       │
│  │   │       └── App Components                                 │
│  │   │           └── useError() hook                            │
│  │   └── Fallback UI (on critical errors)                       │
│  └── Toast Notifications                                         │
├─────────────────────────────────────────────────────────────────┤
│  Logger Service (Console + Remote)                               │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component       | Location                      | Purpose                                  |
| --------------- | ----------------------------- | ---------------------------------------- |
| `AppError`      | `@/lib/errors`                | Base error class with codes and severity |
| `ErrorProvider` | `@/lib/errors/context`        | React context for error reporting        |
| `ErrorBoundary` | `@/components/error-boundary` | Catches React render errors              |
| `logger`        | `@/lib/errors/logger`         | Centralized logging service              |
| `tryCatch`      | `@/lib/errors/utils`          | Async error handling wrapper             |

---

## Error Classes

All custom errors extend the base `AppError` class. Import from `@/lib/errors`.

### AppError (Base Class)

The base error class with the following properties:

```typescript
interface AppError {
  message: string; // Technical error message
  code: ErrorCodeType; // Error code for categorization
  severity: ErrorSeverity; // 'low' | 'medium' | 'high' | 'critical'
  userMessage: string; // User-friendly message for display
  context: ErrorContext; // Additional context (userId, route, etc.)
  originalError?: Error; // Original error if wrapped
  isOperational: boolean; // true = expected error, false = programming error
}
```

### Specialized Error Classes

| Class             | Use Case                              | Default Severity |
| ----------------- | ------------------------------------- | ---------------- |
| `ValidationError` | Input validation failures             | low              |
| `AuthError`       | Authentication/authorization failures | medium           |
| `NetworkError`    | API/network failures                  | medium           |
| `DatabaseError`   | Database operations                   | high             |
| `NotFoundError`   | Missing resources                     | low              |
| `BusinessError`   | Domain rule violations                | medium           |

### Creating Errors

```typescript
import {
  AppError,
  ValidationError,
  AuthError,
  NotFoundError,
  ErrorCode,
} from "@/lib/errors";

// Generic application error
throw new AppError({
  message: "Operation failed",
  code: ErrorCode.UNEXPECTED,
  severity: "medium",
  userMessage: "Something went wrong. Please try again.",
});

// Validation error with field details
throw new ValidationError({
  message: "Invalid email format",
  fields: {
    email: ["Must be a valid email address"],
    password: ["Must be at least 8 characters"],
  },
  userMessage: "Please correct the highlighted fields.",
});

// Authentication error
throw new AuthError({
  message: "Session expired",
  code: ErrorCode.SESSION_EXPIRED,
  userMessage: "Your session has expired. Please sign in again.",
});

// Not found error
throw new NotFoundError({
  message: "User not found",
  resourceType: "User",
  resourceId: userId,
  userMessage: "The requested user could not be found.",
});
```

---

## Error Codes

Error codes are defined in `ErrorCode` constant for categorization:

```typescript
import { ErrorCode } from "@/lib/errors";

// General errors (1000-1999)
ErrorCode.UNKNOWN; // ERR_1000
ErrorCode.UNEXPECTED; // ERR_1001

// Validation errors (2000-2999)
ErrorCode.VALIDATION_FAILED; // ERR_2000
ErrorCode.INVALID_INPUT; // ERR_2001
ErrorCode.MISSING_REQUIRED_FIELD; // ERR_2002
ErrorCode.INVALID_FORMAT; // ERR_2003

// Authentication errors (3000-3999)
ErrorCode.UNAUTHORIZED; // ERR_3000
ErrorCode.SESSION_EXPIRED; // ERR_3001
ErrorCode.INVALID_CREDENTIALS; // ERR_3002
ErrorCode.ACCESS_DENIED; // ERR_3003

// Network errors (4000-4999)
ErrorCode.NETWORK_ERROR; // ERR_4000
ErrorCode.TIMEOUT; // ERR_4001
ErrorCode.SERVICE_UNAVAILABLE; // ERR_4002
ErrorCode.API_ERROR; // ERR_4003

// Database errors (5000-5999)
ErrorCode.DATABASE_ERROR; // ERR_5000
ErrorCode.NOT_FOUND; // ERR_5001
ErrorCode.DUPLICATE_ENTRY; // ERR_5002
ErrorCode.CONSTRAINT_VIOLATION; // ERR_5003

// Business logic errors (6000-6999)
ErrorCode.BUSINESS_RULE_VIOLATION; // ERR_6000
ErrorCode.INSUFFICIENT_PERMISSIONS; // ERR_6001
ErrorCode.OPERATION_NOT_ALLOWED; // ERR_6002
ErrorCode.RESOURCE_LIMIT_EXCEEDED; // ERR_6003
```

---

## Using the Error Context

The `useError` hook provides error handling functions in React components.

### Setup

The `ErrorProvider` is already configured in the root layout. No additional setup needed.

### Available Functions

```typescript
import { useError } from "@/lib/errors/context";

function MyComponent() {
  const { reportError, handleSilently, showError, clearErrors } = useError();

  // ...
}
```

| Function                       | Description                           |
| ------------------------------ | ------------------------------------- |
| `reportError(error, options?)` | Log error and show toast notification |
| `handleSilently(error)`        | Log error only (no toast)             |
| `showError(message, title?)`   | Show toast only (no logging)          |
| `clearErrors()`                | Clear displayed errors                |

### reportError Options

```typescript
interface ErrorHandlerOptions {
  showToast?: boolean; // Show toast notification (default: true)
  logError?: boolean; // Log to console/remote (default: true)
  severity?: ErrorSeverity; // Override error severity
  userMessage?: string; // Override user message
}
```

### Example Usage

```typescript
"use client";

import { useError } from "@/lib/errors/context";

function SaveButton() {
  const { reportError, showError } = useError();

  const handleSave = async () => {
    try {
      await saveData();
    } catch (error) {
      // Full error handling (log + toast)
      reportError(error, {
        userMessage: "Failed to save your changes.",
      });
    }
  };

  const handleValidation = () => {
    if (!isValid) {
      // Toast only, no logging
      showError("Please fill in all required fields", "Validation Error");
      return;
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

---

## Utility Functions

Import from `@/lib/errors/utils` for functional error handling patterns.

### tryCatch (Async)

Wraps async operations and returns a Result type instead of throwing.

```typescript
import { tryCatch } from "@/lib/errors/utils";

// Basic usage
const result = await tryCatch(fetchUser(userId));

if (result.success) {
  console.log(result.data); // User data
} else {
  console.error(result.error.userMessage); // AppError
}

// With options
const result = await tryCatch(api.updateUser(data), {
  userMessage: "Failed to update profile",
  severity: "medium",
  logError: true,
});
```

### safeExecute (Sync)

Wraps synchronous operations.

```typescript
import { safeExecute } from "@/lib/errors/utils";

const result = safeExecute(() => JSON.parse(jsonString));

if (result.success) {
  console.log(result.data);
} else {
  console.error("Invalid JSON");
}
```

### withErrorHandling (HOF)

Higher-order function to wrap async functions.

```typescript
import { withErrorHandling } from "@/lib/errors/utils";

const safeFetchUser = withErrorHandling(fetchUser, {
  userMessage: "Failed to load user",
});

// Returns Result<User> instead of throwing
const result = await safeFetchUser(userId);
```

### Assertions

```typescript
import { assertCondition, assertDefined } from "@/lib/errors/utils";

// Assert a condition
assertCondition(
  user.role === "admin",
  "Admin access required",
  ErrorCode.ACCESS_DENIED,
);

// Assert value is defined
const user = assertDefined(maybeUser, "User not found", ErrorCode.NOT_FOUND);
```

### Safe JSON Operations

```typescript
import { safeJsonParse, safeJsonStringify } from "@/lib/errors/utils";

const parseResult = safeJsonParse<UserData>(jsonString);
if (parseResult.success) {
  console.log(parseResult.data);
}

const stringifyResult = safeJsonStringify(data);
if (stringifyResult.success) {
  localStorage.setItem("data", stringifyResult.data);
}
```

---

## tRPC Error Handling

The tRPC provider automatically handles errors from mutations globally.

### Automatic Handling

All tRPC mutation errors are automatically:

1. Converted to `AppError` instances
2. Logged to the console/remote service
3. Displayed as toast notifications

### Manual Handling in Components

For queries or custom handling:

```typescript
"use client";

import { useError } from "@/lib/errors/context";
import { trpc } from "@/lib/trpc/client";

function UserProfile({ userId }: { userId: string }) {
  const { reportError } = useError();

  const { data, error, isError } = trpc.users.getUserById.useQuery(
    { id: userId },
    {
      onError: (error) => {
        reportError(error, {
          userMessage: "Failed to load profile",
        });
      },
    },
  );

  // ...
}
```

### Server-Side (tRPC Procedures)

In tRPC procedures, throw `TRPCError` which will be converted automatically:

```typescript
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.id);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),
});
```

---

## Error Boundary

The `ErrorBoundary` component catches React rendering errors.

### Default Behavior

Errors in the component tree are caught and display a fallback UI with:

- Error message
- Error code
- "Try Again" button
- "Go Home" button

### Custom Fallback

```typescript
import { ErrorBoundary } from "@/components/error-boundary";

function MyPage() {
  return (
    <ErrorBoundary
      fallback={<CustomErrorUI />}
      onError={(error, errorInfo) => {
        // Custom error handling
        analytics.track("error", { error: error.code });
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

---

## Logging

The logger service provides centralized logging with extensibility for remote services.

### Using the Logger

```typescript
import { logger } from "@/lib/errors/logger";

// Log messages at different levels
logger.debug("Debug info", { userId: "123" });
logger.info("User signed in", { email: "user@example.com" });
logger.warn("Rate limit approaching", { remaining: 10 });
logger.error("Failed to process payment", error, { orderId: "456" });

// Log AppError with appropriate level based on severity
logger.logAppError(appError, { additionalContext: "value" });

// Log any error (converts to AppError first)
logger.logError(unknownError, { source: "payment" });
```

### Configuration

```typescript
import { logger } from "@/lib/errors/logger";

// Configure logger (typically in app initialization)
logger.configure({
  minLevel: "warn", // Only log warn and above
  enableConsole: true, // Log to console
  enableRemote: true, // Send to remote service
  remoteEndpoint: "/api/logs", // Custom endpoint
  onLog: (entry) => {
    // Custom handler
    // Send to Sentry, DataDog, etc.
  },
});
```

### Sentry Integration (Example)

To integrate with Sentry, update the logger configuration:

```typescript
import { logger } from "@/lib/errors/logger";
import * as Sentry from "@sentry/nextjs";

logger.configure({
  onLog: (entry) => {
    if (entry.level === "error" && entry.error) {
      Sentry.captureException(entry.error, {
        extra: entry.context,
        level: entry.level,
      });
    }
  },
});
```

---

## Best Practices

### 1. Use Specific Error Classes

```typescript
// ✅ Good - specific error type
throw new ValidationError({
  message: "Invalid email",
  fields: { email: ["Invalid format"] },
});

// ❌ Avoid - generic error
throw new Error("Invalid email");
```

### 2. Always Provide User Messages

```typescript
// ✅ Good - helpful user message
throw new AppError({
  message: "Database connection timeout",
  userMessage: "We're experiencing technical difficulties. Please try again.",
});

// ❌ Avoid - exposing technical details
throw new AppError({
  message: "ECONNREFUSED 127.0.0.1:5432",
  userMessage: "ECONNREFUSED 127.0.0.1:5432", // Don't expose this!
});
```

### 3. Use tryCatch for External Operations

```typescript
// ✅ Good - safe handling
const result = await tryCatch(externalApi.fetch());
if (!result.success) {
  return { error: result.error.userMessage };
}

// ❌ Avoid - unhandled promise rejection
const data = await externalApi.fetch(); // Could throw!
```

### 4. Add Context to Errors

```typescript
throw new AppError({
  message: "Payment failed",
  context: {
    userId: user.id,
    orderId: order.id,
    action: "processPayment",
  },
});
```

### 5. Handle Errors at the Right Level

```typescript
// ✅ Handle at component level for UI feedback
function CheckoutButton() {
  const { reportError } = useError();

  const handleClick = async () => {
    try {
      await processPayment();
    } catch (error) {
      reportError(error);
    }
  };
}

// ✅ Let tRPC handle mutations automatically
const mutation = trpc.orders.create.useMutation();
// Errors automatically logged and toasted
```

### 6. Use Type Guards

```typescript
import { isAppError } from "@/lib/errors";

try {
  await operation();
} catch (error) {
  if (isAppError(error) && error.code === ErrorCode.NOT_FOUND) {
    // Handle specific error
    return null;
  }
  throw error; // Re-throw unexpected errors
}
```

---

## Examples

### DAL Function with Error Handling

```typescript
// src/db/dal/users.ts
import { DatabaseError, NotFoundError, ErrorCode } from "@/lib/errors";
import { tryCatch } from "@/lib/errors/utils";

export async function getUserById(id: string) {
  const result = await tryCatch(
    db.query.user.findFirst({ where: eq(user.id, id) }),
    {
      userMessage: "Failed to load user data",
      severity: "high",
    },
  );

  if (!result.success) {
    throw new DatabaseError({
      message: result.error.message,
      originalError: result.error,
    });
  }

  if (!result.data) {
    throw new NotFoundError({
      message: `User ${id} not found`,
      resourceType: "User",
      resourceId: id,
    });
  }

  return result.data;
}
```

### Form Component with Validation

```typescript
"use client";

import { useError } from "@/lib/errors/context";
import { ValidationError } from "@/lib/errors";

function ProfileForm() {
  const { reportError, showError } = useError();

  const handleSubmit = async (data: FormData) => {
    // Client-side validation
    const errors: Record<string, string[]> = {};

    if (!data.email) {
      errors.email = ["Email is required"];
    }

    if (Object.keys(errors).length > 0) {
      showError("Please fix the errors below", "Validation Error");
      return;
    }

    try {
      await saveProfile(data);
    } catch (error) {
      reportError(error, {
        userMessage: "Could not save your profile. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### Server Action with Error Handling

```typescript
// src/actions/user.ts
"use server";

import { AppError, AuthError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/errors/logger";

export async function updateUserAction(formData: FormData) {
  try {
    const session = await getSession();

    if (!session) {
      throw new AuthError({
        message: "No session found",
        userMessage: "Please sign in to continue.",
      });
    }

    await updateUser(session.userId, formData);

    return { success: true };
  } catch (error) {
    const appError = AppError.fromUnknown(error);
    logger.logAppError(appError);

    return {
      success: false,
      error: appError.userMessage,
      code: appError.code,
    };
  }
}
```

---

## Migration Guide

If you have existing error handling, here's how to migrate:

### Before

```typescript
try {
  await operation();
} catch (error) {
  console.error(error);
  toast.error("Something went wrong");
}
```

### After

```typescript
import { useError } from "@/lib/errors/context";

const { reportError } = useError();

try {
  await operation();
} catch (error) {
  reportError(error, {
    userMessage: "Could not complete the operation",
  });
}
```

### Or with tryCatch

```typescript
import { tryCatch } from "@/lib/errors/utils";

const result = await tryCatch(operation(), {
  userMessage: "Could not complete the operation",
});

if (!result.success) {
  // Error already logged, handle UI state
  setError(result.error.userMessage);
}
```
