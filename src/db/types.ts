import z from "zod";

declare const __brand: unique symbol;

export type Brand<T, B> = T & { [__brand]: B };

export type UserId = Brand<string, "UserId">;
export type CoachId = Brand<string, "CoachId">;
export type ManagerId = Brand<string, "ManagerId">;
export type MemberId = Brand<string, "MemberId">;

export type ClubId = Brand<string, "ClubId">;
export type SiteId = Brand<string, "SiteId">;
export type RoomId = Brand<string, "RoomId">;
export type PageId = Brand<string, "PageId">;
export type CalendarId = Brand<string, "CalendarId">;
export type PlanningId = Brand<string, "PlanningId">;
export type ReservationId = Brand<string, "ReservationId">;
export type CourseId = Brand<string, "CourseId">;
export type ActivityId = Brand<string, "ActivityId">;
export type ActivityGroupId = Brand<string, "ActivityGroupId">;
export type SubscriptionId = Brand<string, "SubscriptionId">;
export type SessionId = Brand<string, "SessionId">;
export type PricingId = Brand<string, "PricingId">;
export type AccountId = Brand<string, "AccountId">;

export const ZodUserId = z.string().transform((s) => s as UserId);
export const ZodManagerId = z.string().transform((s) => s as ManagerId);
export const ZodMemberId = z.string().transform((s) => s as MemberId);
export const ZodCoachId = z.string().transform((s) => s as CoachId);
export const ZodClubId = z.string().transform((s) => s as ClubId);
export const ZodPageId = z.string().transform((s) => s as PageId);
export const ZodPlanningId = z.string().transform((s) => s as PlanningId);
export const ZodSiteId = z.string().transform((s) => s as SiteId);
export const ZodRoomId = z.string().transform((s) => s as RoomId);
export const ZodReservationId = z.string().transform((s) => s as ReservationId);
export const ZodCourseId = z.string().transform((s) => s as CourseId);
export const ZodActivityId = z.string().transform((s) => s as ActivityId);
export const ZodCalendarId = z.string().transform((s) => s as CalendarId);
export const ZodActivityGroupId = z
  .string()
  .transform((s) => s as ActivityGroupId);
export const ZodSubscriptionId = z
  .string()
  .transform((s) => s as SubscriptionId);
export const ZodSessionId = z.string().transform((s) => s as SessionId);
export const ZodPricingId = z.string().transform((s) => s as PricingId);
export const ZodAccountId = z.string().transform((s) => s as AccountId);
