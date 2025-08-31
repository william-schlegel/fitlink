// Enums

import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("Role", [
  "MEMBER",
  "COACH",
  "MANAGER",
  "MANAGER_COACH",
  "ADMIN",
]);

export type RoleEnum = (typeof roleEnum.enumValues)[number];

export const userDocumentTypeEnum = pgEnum("UserDocumentType", [
  "DOCUMENT",
  "IMAGE",
  "PROFILE_IMAGE",
  "PAGE_IMAGE",
  "CERTIFICATION",
  "MEDICAL_CERTIFICAT",
]);

export const notificationTypeEnum = pgEnum("NotificationType", [
  "SEARCH_COACH",
  "SEARCH_CLUB",
  "COACH_ACCEPT",
  "COACH_REFUSE",
  "CLUB_ACCEPT",
  "CLUB_REFUSE",
  "NEW_MESSAGE",
  "NEW_SUBSCRIPTION",
  "NEW_REQUEST",
  "SUBSCRIPTION_VALIDATED",
  "SUBSCRIPTION_REJECTED",
  "REQUEST_VALIDATED",
  "REQUEST_REJECTED",
]);

export const roomReservationEnum = pgEnum("RoomReservation", [
  "NONE",
  "POSSIBLE",
  "MANDATORY",
]);

export const subscriptionModeEnum = pgEnum("SubscriptionMode", [
  "ALL_INCLUSIVE",
  "ACTIVITY_GROUP",
  "ACTIVITY",
  "DAY",
  "COURSE",
]);

export type SubscriptionModeEnum =
  (typeof subscriptionModeEnum.enumValues)[number];

export const subscriptionRestrictionEnum = pgEnum("SubscriptionRestriction", [
  "CLUB",
  "SITE",
  "ROOM",
]);

export type SubscriptionRestrictionEnum =
  (typeof subscriptionRestrictionEnum.enumValues)[number];

export const coachingLevelListEnum = pgEnum("CoachingLevelList", [
  "ALL",
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
  "COMPETITOR",
  "PROFESSIONAL",
]);

export const coachingTargetEnum = pgEnum("CoachingTarget", [
  "INDIVIDUAL",
  "COMPANY",
]);

export const packModeEnum = pgEnum("PackMode", ["PHYSICAL", "WEBCAM"]);

export const dayNameEnum = pgEnum("DayName", [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
]);

export const featureEnum = pgEnum("Feature", [
  "COACH_OFFER",
  "COACH_OFFER_COMPANY",
  "COACH_CERTIFICATION",
  "COACH_MEETING",
  "COACH_MARKET_PLACE",
  "MANAGER_MULTI_CLUB",
  "MANAGER_MULTI_SITE",
  "MANAGER_ROOM",
  "MANAGER_EVENT",
  "MANAGER_PLANNING",
  "MANAGER_COACH",
  "MANAGER_MARKET_PLACE",
  "MANAGER_SHOP",
  "MANAGER_EMPLOYEES",
]);

export type FeatureEnum = (typeof featureEnum.enumValues)[number];

export const pageTargetEnum = pgEnum("PageTarget", [
  "HOME",
  "ACTIVITIES",
  "OFFERS",
  "TEAM",
  "PLANNING",
  "VIDEOS",
  "EVENTS",
]);

export const pageSectionModelEnum = pgEnum("PageSectionModel", [
  "HERO",
  "TITLE",
  "PLANNINGS",
  "ACTIVITY_GROUPS",
  "ACTIVITIES",
  "OFFERS",
  "VIDEO",
  "LOCATION",
  "SOCIAL",
  "TEAMMATES",
  "CONTACT",
  "FOOTER",
]);

export type PageSectionModelEnum =
  (typeof pageSectionModelEnum.enumValues)[number];

export const pageSectionElementTypeEnum = pgEnum("PageSectionElementType", [
  "HERO_CONTENT",
  "CTA",
  "CARD",
  "OPENING_TIME",
  "MAP",
  "FEATURE",
  "BUTTON",
  "NEWSLETTER",
  "OPTION",
]);

export type PageSectionElementTypeEnum =
  (typeof pageSectionElementTypeEnum.enumValues)[number];

export const coachMarketPlaceTypeEnum = pgEnum("CoachMarketPlaceType", [
  "SEARCH",
  "OFFER",
]);
