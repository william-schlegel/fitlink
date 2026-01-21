# Data Access Layer (DAL) & Shared Schemas Guide

This guide explains how to use the Data Access Layer and shared Zod schemas in the Fitlink project for consistent, type-safe database operations.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Shared Schemas](#shared-schemas)
4. [Using DAL in tRPC Routers](#using-dal-in-trpc-routers)
5. [Using DAL in Server Actions](#using-dal-in-server-actions)
6. [Transaction Support](#transaction-support)
7. [Authorization Helpers](#authorization-helpers)
8. [Best Practices](#best-practices)
9. [Examples](#examples)

---

## Architecture Overview

The codebase follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React Components)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              tRPC Routers / Server Actions                   │
│  • Input validation (Zod schemas)                            │
│  • Authorization checks                                      │
│  • Business logic orchestration                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Access Layer (DAL)                     │
│  • Database queries & mutations                              │
│  • Type-safe inputs (from schemas)                           │
│  • No authorization (handled above)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Single Source of Truth**: Zod schemas define data shapes once
2. **Validation at Entry Points**: Validate in routers/actions, not in DAL
3. **Type Safety Without Runtime Overhead**: DAL uses inferred types, no double validation
4. **Separation of Concerns**: Authorization in routers, data access in DAL

---

## Directory Structure

```
src/
├── schemas/                    # Shared Zod schemas
│   ├── index.ts               # Re-exports all schemas
│   ├── activities.ts          # Activity & ActivityGroup schemas
│   ├── certifications.ts      # Certification schemas
│   ├── clubs.ts               # Club schemas
│   ├── coaching.ts            # Coach offers schemas
│   ├── sites.ts               # Site & Room schemas
│   └── users.ts               # User schemas
│
├── db/
│   ├── dal/                   # Data Access Layer
│   │   ├── index.ts           # Re-exports all DAL functions
│   │   ├── activities.ts      # Activity database operations
│   │   ├── certifications.ts  # Certification operations
│   │   ├── clubs.ts           # Club operations
│   │   ├── coaching.ts        # Coaching operations
│   │   ├── sites.ts           # Site & Room operations
│   │   ├── users.ts           # User operations
│   │   └── ...
│   ├── schema/                # Drizzle schema definitions
│   └── index.ts               # Database connection & types
│
├── server/
│   ├── api/routers/           # tRPC routers
│   └── lib/
│       └── userTools.ts       # Authorization helpers
│
└── actions/                   # Server actions (if used)
```

---

## Shared Schemas

### Creating a Schema File

Each schema file should export:

1. **Zod schemas** for validation
2. **Inferred TypeScript types** for type safety

```typescript
// src/schemas/activities.ts
import { z } from "zod";

// ==================== BASE SCHEMAS ====================

/**
 * Base activity schema with all fields
 */
export const activitySchema = z.object({
  id: z.cuid2(),
  name: z.string(),
  noCalendar: z.boolean().default(false),
  reservationDuration: z.number().default(60),
  clubId: z.cuid2(),
  groupId: z.cuid2(),
});

// ==================== OPERATION SCHEMAS ====================

/**
 * Schema for creating (no id required)
 */
export const createActivitySchema = activitySchema.omit({ id: true });

/**
 * Schema for updating (all fields optional)
 */
export const updateActivitySchema = activitySchema.partial();

// ==================== INFERRED TYPES ====================

export type Activity = z.infer<typeof activitySchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
```

### Schema Naming Conventions

| Pattern                | Description                 | Example                |
| ---------------------- | --------------------------- | ---------------------- |
| `{entity}Schema`       | Base schema with all fields | `activitySchema`       |
| `create{Entity}Schema` | For creation (no id)        | `createActivitySchema` |
| `update{Entity}Schema` | For updates (partial)       | `updateActivitySchema` |
| `{Entity}`             | Inferred type               | `Activity`             |
| `Create{Entity}Input`  | Creation input type         | `CreateActivityInput`  |
| `Update{Entity}Input`  | Update input type           | `UpdateActivityInput`  |

### When to Create Separate DB Schemas

Sometimes the router input differs from what the DAL needs:

```typescript
// Router receives this (with userId)
export const createCertificationSchema = z.object({
  name: z.string(),
  userId: z.string(), // User provides their ID
  modules: z.array(z.cuid2()),
});

// DAL receives this (with coachId, no modules)
export const createCertificationDbSchema = z.object({
  name: z.string(),
  coachId: z.string(), // Mapped from userId
  documentUrl: z.string().optional(),
});
```

---

## Using DAL in tRPC Routers

### Basic Pattern

```typescript
// src/server/api/routers/activities.ts
import { z } from "zod";

import { createActivity, updateActivity, deleteActivity } from "@/db/dal";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";
import { activitySchema } from "@/schemas/activities";

export const activityRouter = createTRPCRouter({
  // Query - simple passthrough
  getById: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => getActivityById(input)),

  // Mutation - with schema validation
  create: protectedProcedure
    .input(activitySchema.omit({ id: true }))
    .mutation(({ input }) => createActivity(input)),

  // Mutation - with partial schema for updates
  update: protectedProcedure
    .input(activitySchema.partial())
    .mutation(({ input }) => updateActivity(input)),

  // Mutation - simple id input
  delete: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) => deleteActivity(input)),
});
```

### With Authorization

```typescript
import { requireAdmin, requireAdminOrSelf } from "@/server/lib/userTools";

export const activityRouter = createTRPCRouter({
  // Only admins can access
  getAll: protectedProcedure.input(z.cuid2()).query(({ ctx, input }) => {
    requireAdmin(ctx.user);
    return getAllActivitiesForGroup(input);
  }),

  // Admin or the user themselves
  getForUser: protectedProcedure
    .input(z.object({ clubId: z.cuid2(), userId: z.string() }))
    .query(({ ctx, input }) => {
      requireAdminOrSelf(ctx.user, input.userId);
      return getActivitiesForClub(input.clubId);
    }),
});
```

### With Business Logic

```typescript
export const clubRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createClubSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Authorization
      requireAdminOrSelf(ctx.user, input.userId);

      // 2. Create club via DAL
      const club = await createClub({
        name: input.name,
        address: input.address,
        managerId: input.userId,
      });

      // 3. Additional business logic (external service)
      const convexRoomId = await createClubRoomInConvex(
        club[0].id,
        input.name,
        input.userId,
      );

      // 4. Update with external data
      if (convexRoomId) {
        await updateClubConvexRoomId(club[0].id, String(convexRoomId));
      }

      // 5. Create related entities
      if (input.isSite) {
        await createSiteForClub({
          clubId: club[0].id,
          ...input,
        });
      }

      return club[0];
    }),
});
```

---

## Using DAL in Server Actions

Server actions follow the same pattern but use the `"use server"` directive:

```typescript
// src/actions/activities.ts
"use server";

import {
  createActivitySchema,
  updateActivitySchema,
} from "@/schemas/activities";
import { createActivity, updateActivity } from "@/db/dal";
import { getActualUser } from "@/lib/auth/server";

import type { CreateActivityInput } from "@/schemas/activities";

export async function createActivityAction(rawInput: CreateActivityInput) {
  // 1. Get current user
  const user = await getActualUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Validate input (optional but recommended for server actions)
  const input = createActivitySchema.parse(rawInput);

  // 3. Authorization check
  if (user.internalRole !== "ADMIN" && user.internalRole !== "MANAGER") {
    throw new Error("Insufficient permissions");
  }

  // 4. Call DAL
  return createActivity(input);
}
```

### Server Action vs tRPC Router Decision

| Use tRPC Router When           | Use Server Action When         |
| ------------------------------ | ------------------------------ |
| Complex queries with relations | Simple form submissions        |
| Need caching/invalidation      | Progressive enhancement needed |
| Multiple related operations    | Direct form action binding     |
| Real-time subscriptions        | Simpler mental model preferred |

---

## Transaction Support

DAL functions support optional transaction parameters for atomicity:

### DAL Function with Transaction Support

```typescript
// src/db/dal/users.ts
import { db, TxClient } from "@/db";

export async function updateUser(
  data: UpdateUserDbInput,
  tx?: TxClient, // Optional transaction client
) {
  const client = tx ?? db; // Use transaction or default db
  return client.update(user).set(data).where(eq(user.id, data.id)).returning();
}
```

### Using Transactions in Routers

```typescript
export const userRouter = createTRPCRouter({
  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      return db.transaction(async (tx) => {
        // All operations use the same transaction
        const coach = await getOrCreateCoachData(input.id, tx);
        await updateCoachData({ ...coachData }, tx);
        return updateUser({ ...userData }, tx);
      });
    }),
});
```

### When to Use Transactions

- Multiple related inserts/updates that must succeed together
- Operations that read-then-write (prevent race conditions)
- Complex workflows with rollback requirements

---

## Authorization Helpers

Located in `src/server/lib/userTools.ts`:

### Synchronous Helpers (for tRPC routers)

```typescript
import {
  requireAdmin,
  requireAdminOrSelf,
  requireAdminOrOwner,
  requireRole,
} from "@/server/lib/userTools";

// Only admin
requireAdmin(ctx.user);

// Admin or the user themselves
requireAdminOrSelf(ctx.user, targetUserId);

// Admin or resource owner (e.g., club manager)
requireAdminOrOwner(ctx.user, club.managerId);

// Specific roles
requireRole(ctx.user, ["COACH", "MANAGER_COACH"]);
```

### Async Helpers (for server actions)

```typescript
import { isAdmin, hasRole } from "@/server/lib/userTools";

// Fetches user from session and checks
await isAdmin(true); // throws if not admin
await hasRole(["COACH", "MANAGER"], true); // throws if not in roles
```

---

## Best Practices

### DO ✅

1. **Define schemas once in `/schemas`**

   ```typescript
   // Good: Single source of truth
   import { activitySchema } from "@/schemas/activities";
   ```

2. **Use inferred types in DAL (no runtime validation)**

   ```typescript
   // Good: Type-only import
   import type { CreateActivityInput } from "@/schemas/activities";

   export async function createActivity(data: CreateActivityInput) { ... }
   ```

3. **Validate in routers/actions, not DAL**

   ```typescript
   // Good: Validation at entry point
   .input(activitySchema.omit({ id: true }))
   .mutation(({ input }) => createActivity(input))
   ```

4. **Use authorization helpers consistently**

   ```typescript
   // Good: Clear authorization
   requireAdminOrSelf(ctx.user, input.userId);
   return getData(input.userId);
   ```

5. **Pass transaction client when atomicity needed**

   ```typescript
   // Good: All operations in same transaction
   return db.transaction(async (tx) => {
     await operation1(data1, tx);
     await operation2(data2, tx);
   });
   ```

### DON'T ❌

1. **Don't define inline schemas in routers**

   ```typescript
   // Bad: Duplicated schema
   .input(z.object({
     name: z.string(),
     clubId: z.cuid2(),
   }))
   ```

2. **Don't validate in DAL functions**

   ```typescript
   // Bad: Double validation
   export async function createActivity(rawData: unknown) {
     const data = activitySchema.parse(rawData); // Unnecessary
     return db.insert(activity).values(data);
   }
   ```

3. **Don't put authorization in DAL**

   ```typescript
   // Bad: Authorization belongs in router
   export async function createActivity(data, userId) {
     if (!isAdmin(userId)) throw new Error(); // Move to router
     return db.insert(activity).values(data);
   }
   ```

4. **Don't mix transaction and non-transaction calls**

   ```typescript
   // Bad: operation2 won't rollback if operation3 fails
   return db.transaction(async (tx) => {
     await operation1(data1, tx);
     await operation2(data2); // Missing tx!
     await operation3(data3, tx);
   });
   ```

---

## Examples

### Complete Router Example

```typescript
// src/server/api/routers/activities.ts
import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  activitySchema,
  updateActivityGroupSchema,
  roomActivitySchema,
} from "@/schemas/activities";
import {
  requireAdmin,
  requireAdminOrSelf,
  requireAdminOrOwner,
} from "@/server/lib/userTools";
import {
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
} from "@/db/dal";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { activityGroup } from "@/db/schema/club";
import { db } from "@/db";

export const activityRouter = createTRPCRouter({
  // Simple query
  getById: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => getActivityById(input)),

  // Query with authorization
  getForClub: protectedProcedure
    .input(z.object({ clubId: z.cuid2(), userId: z.string() }))
    .query(({ ctx, input }) => {
      requireAdminOrSelf(ctx.user, input.userId);
      return getActivitiesForClub(input.clubId);
    }),

  // Create with shared schema
  create: protectedProcedure
    .input(activitySchema.omit({ id: true }))
    .mutation(({ input }) => createActivity(input)),

  // Update with partial schema
  update: protectedProcedure
    .input(activitySchema.partial())
    .mutation(({ input }) => updateActivity(input)),

  // Delete with ownership check
  deleteGroup: protectedProcedure
    .input(z.object({ groupId: z.cuid2() }))
    .mutation(async ({ ctx, input }) => {
      // Fetch to check ownership
      const group = await db.query.activityGroup.findFirst({
        where: eq(activityGroup.id, input.groupId),
      });

      // Check authorization
      requireAdminOrOwner(ctx.user, group?.coachId);

      // Perform delete
      return deleteActivityGroup(input.groupId);
    }),
});
```

### Complete DAL Example

```typescript
// src/db/dal/activities.ts
import { and, asc, eq, ilike, or } from "drizzle-orm";

import { activity, activityGroup, roomActivities } from "@/db/schema/club";
import { db, TxClient } from "@/db";

import type {
  CreateActivityInput,
  UpdateActivityInput,
  CreateActivityGroupInput,
  UpdateActivityGroupInput,
} from "@/schemas/activities";

// ==================== QUERIES ====================

export async function getActivityById(id: string) {
  return db.query.activity.findFirst({
    where: eq(activity.id, id),
  });
}

export async function getActivityByName(name: string) {
  return db.query.activity.findMany({
    where: ilike(activity.name, `%${name}%`),
    limit: 25,
    with: { group: true },
  });
}

// ==================== MUTATIONS ====================

export async function createActivity(data: CreateActivityInput, tx?: TxClient) {
  const client = tx ?? db;
  return client.insert(activity).values(data);
}

export async function updateActivity(data: UpdateActivityInput, tx?: TxClient) {
  const client = tx ?? db;
  return client
    .update(activity)
    .set(data)
    .where(eq(activity.id, data.id ?? ""));
}

export async function deleteActivity(id: string, tx?: TxClient) {
  const client = tx ?? db;
  return client.delete(activity).where(eq(activity.id, id));
}
```

### Complete Server Action Example

```typescript
// src/actions/activities.ts
"use server";

import { revalidatePath } from "next/cache";

import {
  createActivitySchema,
  updateActivitySchema,
} from "@/schemas/activities";
import { createActivity, updateActivity, deleteActivity } from "@/db/dal";
import { getActualUser } from "@/lib/auth/server";

import type {
  CreateActivityInput,
  UpdateActivityInput,
} from "@/schemas/activities";

export async function createActivityAction(rawInput: CreateActivityInput) {
  // 1. Authentication
  const user = await getActualUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // 2. Validation
  const parseResult = createActivitySchema.safeParse(rawInput);
  if (!parseResult.success) {
    return { error: "Invalid input", details: parseResult.error.flatten() };
  }

  // 3. Authorization
  if (
    !["ADMIN", "MANAGER", "MANAGER_COACH"].includes(user.internalRole ?? "")
  ) {
    return { error: "Insufficient permissions" };
  }

  try {
    // 4. Database operation
    const result = await createActivity(parseResult.data);

    // 5. Revalidate cache
    revalidatePath("/activities");

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create activity:", error);
    return { error: "Failed to create activity" };
  }
}

export async function updateActivityAction(rawInput: UpdateActivityInput) {
  const user = await getActualUser();
  if (!user) return { error: "Unauthorized" };

  const parseResult = updateActivitySchema.safeParse(rawInput);
  if (!parseResult.success) {
    return { error: "Invalid input" };
  }

  try {
    const result = await updateActivity(parseResult.data);
    revalidatePath("/activities");
    return { success: true, data: result };
  } catch (error) {
    return { error: "Failed to update activity" };
  }
}
```

---

## Summary

| Layer              | Responsibility                         | Imports                           |
| ------------------ | -------------------------------------- | --------------------------------- |
| **Schemas**        | Define data shapes, provide types      | `zod`                             |
| **Routers**        | Validate input, authorize, orchestrate | Schemas, DAL, auth helpers        |
| **Server Actions** | Same as routers, for form actions      | Schemas, DAL, auth helpers        |
| **DAL**            | Database queries/mutations only        | Schema types (type-only), Drizzle |

This architecture ensures:

- ✅ Type safety across the entire stack
- ✅ Single source of truth for data shapes
- ✅ Clear separation of concerns
- ✅ No unnecessary runtime overhead
- ✅ Easy testing and maintenance
