import { z } from "zod";

import { coachingLevelListEnum, coachingTargetEnum } from "@/db/schema/enums";
import { LATITUDE, LONGITUDE, DEFAULT_RANGE } from "@/lib/defaultValues";

// ==================== COACH OFFER SCHEMAS ====================

/**
 * Pack schema for coaching offers
 */
export const coachingPackSchema = z.object({
  nbHours: z.number().min(0),
  packPrice: z.number().min(0),
});

/**
 * Base coaching offer schema
 */
export const coachOfferSchema = z.object({
  id: z.cuid2(),
  coachId: z.string(),
  name: z.string(),
  target: z.enum(coachingTargetEnum.enumValues),
  excludingTaxes: z.boolean(),
  description: z.string(),
  startDate: z.date(),
  physical: z.boolean().default(false),
  inHouse: z.boolean().default(false),
  myPlace: z.boolean().default(false),
  publicPlace: z.boolean().default(false),
  perHourPhysical: z.number().min(0),
  perDayPhysical: z.number().min(0),
  travelFee: z.number().min(0),
  travelLimit: z.number().min(0),
  webcam: z.boolean().default(false),
  perHourWebcam: z.number().min(0),
  perDayWebcam: z.number().min(0),
  freeHours: z.number().min(0),
  levels: z.array(z.enum(coachingLevelListEnum.enumValues)),
  packs: z.array(coachingPackSchema),
});

/**
 * Schema for creating a coaching offer
 */
export const createCoachOfferSchema = coachOfferSchema.omit({ id: true });

/**
 * Schema for updating a coaching offer
 */
export const updateCoachOfferSchema = coachOfferSchema.partial().extend({
  id: z.cuid2(),
});

// ==================== COACH SEARCH SCHEMAS ====================

/**
 * Schema for coach distance search
 */
export const coachDistanceSearchSchema = z.object({
  locationLng: z.number().default(LONGITUDE),
  locationLat: z.number().default(LATITUDE),
  range: z.number().max(100).default(DEFAULT_RANGE),
});

/**
 * Schema for company offers search
 */
export const companyOffersSearchSchema = z.object({
  locationLng: z.number().default(LONGITUDE),
  locationLat: z.number().default(LATITUDE),
  range: z.number().max(100).default(DEFAULT_RANGE),
  priceMin: z.number().min(0).default(0),
  priceMax: z.number().max(1000).default(1000),
});

// ==================== COACH DATA SCHEMAS ====================

/**
 * Schema for coach data updates
 */
export const updateCoachDataSchema = z.object({
  id: z.string(),
  userId: z.string(),
  longitude: z.number().optional(),
  latitude: z.number().optional(),
  searchAddress: z.string().optional(),
  range: z.number().min(0).max(100).optional(),
  publicName: z.string().optional(),
  aboutMe: z.string().optional(),
  description: z.string().optional(),
  coachingActivities: z.array(z.string()).optional(),
  convexRoomId: z.string().optional(),
});

// ==================== INFERRED TYPES ====================

export type CoachingPack = z.infer<typeof coachingPackSchema>;
export type CoachOffer = z.infer<typeof coachOfferSchema>;
export type CreateCoachOfferInput = z.infer<typeof createCoachOfferSchema>;
export type UpdateCoachOfferInput = z.infer<typeof updateCoachOfferSchema>;

export type CoachDistanceSearchInput = z.infer<typeof coachDistanceSearchSchema>;
export type CompanyOffersSearchInput = z.infer<typeof companyOffersSearchSchema>;
export type UpdateCoachDataInput = z.infer<typeof updateCoachDataSchema>;

