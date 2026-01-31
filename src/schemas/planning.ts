import { dayNameEnum } from "@/db/schema/enums";
import {
  ZodActivityId,
  ZodCalendarId,
  ZodClubId,
  ZodPlanningId,
  ZodRoomId,
  ZodSiteId,
  ZodUserId,
} from "@/db/types";
import { z } from "zod";

// ==================== PLANNING SCHEMAS ====================

/**
 * Base calendar schema with all fields
 */
export const calendarSchema = z.object({
  id: ZodCalendarId,
  startDate: z.date(),
  clubId: ZodClubId,
  siteId: ZodSiteId.nullable(),
  roomId: ZodRoomId.nullable(),
  openingTimes: z.array(
    z.object({
      day: z.enum(dayNameEnum.enumValues),
      wholeDay: z.boolean(),
      closed: z.boolean(),
      workingHours: z.array(
        z.object({
          opening: z.string(),
          closing: z.string(),
        }),
      ),
    }),
  ),
});

export type CalendarData = z.infer<typeof calendarSchema>;
export type CreateCalendarInput = Omit<CalendarData, "id">;
export type UpdateCalendarInput = CalendarData;

/**
 * Planning schema with all fields
 */

export const planningItemSchema = z.object({
  slotId: z.string(),
  activityId: ZodActivityId,
  day: z.enum(dayNameEnum.enumValues),
  startTime: z.string(),
  duration: z.number(),
  coachUserId: ZodUserId.nullable(),
  roomId: ZodRoomId.nullable(),
  siteId: ZodSiteId.nullable(),
  deleted: z.boolean().default(false),
});

export const planningSchema = z.object({
  id: ZodPlanningId,
  name: z.string().nullable(),
  clubId: ZodClubId,
  siteId: ZodSiteId.optional(),
  roomId: ZodRoomId.optional(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  planningItems: z.array(planningItemSchema),
});

export type PlanningData = z.infer<typeof planningSchema>;
export type CreatePlanningInput = Omit<PlanningData, "id">;
export type UpdatePlanningInput = Partial<PlanningData>;

export type PlanningItemData = z.infer<typeof planningItemSchema>;
export type UpdatePlanningItemInput = Partial<PlanningItemData>;

export const planningSearchItemSchema = z.object({
  slotId: z.string(),
  activityId: ZodActivityId,
  activityName: z.string(),
  day: z.enum(dayNameEnum.enumValues),
  dayName: z.string(),
  startTime: z.string(),
  duration: z.number(),
  coachUserId: ZodUserId.nullable(),
  coachName: z.string(),
  roomId: ZodRoomId.nullable(),
  roomName: z.string(),
  siteId: ZodSiteId.nullable(),
  siteName: z.string(),
  deleted: z.boolean().default(false),
});

export const planningSearchReturnSchema = z.object({
  id: ZodPlanningId,
  name: z.string().nullable(),
  clubId: ZodClubId,
  siteId: ZodSiteId.nullable(),
  siteName: z.string(),
  roomId: ZodRoomId.nullable(),
  roomName: z.string(),
  clubName: z.string(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  planningItems: z.array(planningSearchItemSchema),
});

export type PlanningSearchItemData = z.infer<typeof planningSearchItemSchema>;

export type PlanningSearchReturnData = z.infer<
  typeof planningSearchReturnSchema
>;
