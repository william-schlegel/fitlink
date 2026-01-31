import {
  ZodActivityGroupId,
  ZodActivityId,
  ZodClubId,
  ZodRoomId,
  ZodUserId,
} from "@/db/types";
import { z } from "zod";

// ==================== ACTIVITY SCHEMAS ====================

/**
 * Base activity schema with all fields
 */
export const activitySchema = z.object({
  id: ZodActivityId,
  name: z.string(),
  noCalendar: z.boolean().default(false),
  reservationDuration: z.number().default(60),
  clubId: ZodClubId,
  groupId: ZodActivityGroupId,
});

/**
 * Schema for creating a new activity (no id required)
 */
export const createActivitySchema = activitySchema.omit({ id: true });

/**
 * Schema for updating an activity (all fields optional except logic requires id)
 */
export const updateActivitySchema = activitySchema.partial().extend({
  id: ZodActivityId,
});

// ==================== ACTIVITY GROUP SCHEMAS ====================

/**
 * Base activity group schema
 */
export const activityGroupSchema = z.object({
  id: ZodActivityGroupId,
  name: z.string(),
  coachUserId: ZodUserId.optional().nullable(),
  default: z.boolean().optional().default(false),
});

/**
 * Schema for creating an activity group
 */
export const createActivityGroupSchema = activityGroupSchema.omit({ id: true });

/**
 * Schema for updating an activity group
 */
export const updateActivityGroupSchema = z.object({
  id: ZodActivityGroupId,
  name: z.string(),
  default: z.boolean().optional().default(false),
});

// ==================== ROOM ACTIVITY SCHEMAS ====================

/**
 * Schema for room-activity relationship
 */
export const roomActivitySchema = z.object({
  roomId: ZodRoomId,
  activityId: ZodActivityId,
});

// ==================== INFERRED TYPES ====================

export type Activity = z.infer<typeof activitySchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

export type ActivityGroup = z.infer<typeof activityGroupSchema>;
export type CreateActivityGroupInput = z.infer<
  typeof createActivityGroupSchema
>;
export type UpdateActivityGroupInput = z.infer<
  typeof updateActivityGroupSchema
>;

export type RoomActivityInput = z.infer<typeof roomActivitySchema>;
