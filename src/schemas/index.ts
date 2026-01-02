/**
 * Shared Zod schemas for consistent data validation across routers and DAL
 *
 * Usage:
 * - Import schemas in routers for input validation
 * - Import inferred types in DAL for type safety without runtime validation
 *
 * Example:
 * // In router:
 * import { createActivitySchema } from "@/schemas/activities";
 * .input(createActivitySchema)
 *
 * // In DAL:
 * import type { CreateActivityInput } from "@/schemas/activities";
 * function createActivity(data: CreateActivityInput) { ... }
 */

export * from "./activities";
export * from "./certifications";
export * from "./clubs";
export * from "./coaching";
export * from "./sites";
export * from "./users";

