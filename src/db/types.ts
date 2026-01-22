import z from "zod";

declare const __brand: unique symbol;

export type Brand<T, B> = T & { [__brand]: B };

export type UserId = Brand<string, "UserId">;
export type ClubId = Brand<string, "ClubId">;
export type CoachId = Brand<string, "CoachId">;
export type PageId = Brand<string, "PageId">;
export type PlanningId = Brand<string, "PlanningId">;
export type SubscriptionId = Brand<string, "SubscriptionId">;
export type UserCoachId = Brand<string, "UserCoachId">;
export type UserManagerId = Brand<string, "UserManagerId">;
export type UserMemberId = Brand<string, "UserMemberId">;
export type SessionId = Brand<string, "SessionId">;
export type PricingId = Brand<string, "PricingId">;
export type AccountId = Brand<string, "AccountId">;

export const ZodUserId = z.string().transform((s) => s as UserId);
