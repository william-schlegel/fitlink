import z from "zod";

declare const __brand: unique symbol;

export type Brand<T, B> = T & { [__brand]: B };

export type UserId = Brand<string, "UserId">;
export type ClubId = Brand<string, "ClubId">;
export type SiteId = Brand<string, "SiteId">;
export type RoomId = Brand<string, "RoomId">;
export type PageId = Brand<string, "PageId">;
export type CalendarId = Brand<string, "CalendarId">;
export type PlanningId = Brand<string, "PlanningId">;
export type ReservationId = Brand<string, "ReservationId">;
export type ActivityId = Brand<string, "ActivityId">;
export type SubscriptionId = Brand<string, "SubscriptionId">;
export type SessionId = Brand<string, "SessionId">;
export type PricingId = Brand<string, "PricingId">;
export type AccountId = Brand<string, "AccountId">;

export const ZodUserId = z.string().transform((s) => s as UserId);
export const ZodClubId = z.string().transform((s) => s as ClubId);
export const ZodPageId = z.string().transform((s) => s as PageId);
export const ZodPlanningId = z.string().transform((s) => s as PlanningId);
export const ZodSiteId = z.string().transform((s) => s as SiteId);
export const ZodRoomId = z.string().transform((s) => s as RoomId);
export const ZodReservationId = z.string().transform((s) => s as ReservationId);
export const ZodActivityId = z.string().transform((s) => s as ActivityId);
export const ZodCalendarId = z.string().transform((s) => s as CalendarId);
export const ZodSubscriptionId = z
  .string()
  .transform((s) => s as SubscriptionId);
export const ZodSessionId = z.string().transform((s) => s as SessionId);
export const ZodPricingId = z.string().transform((s) => s as PricingId);
export const ZodAccountId = z.string().transform((s) => s as AccountId);
