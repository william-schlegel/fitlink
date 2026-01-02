import { z } from "zod";

// ==================== CLUB SCHEMAS ====================

/**
 * Base club schema
 */
export const clubSchema = z.object({
  id: z.cuid2(),
  name: z.string(),
  address: z.string(),
  managerId: z.string(),
  logoUrl: z.string().optional().nullable(),
  convexRoomId: z.string().optional().nullable(),
});

/**
 * Schema for creating a club
 */
export const createClubSchema = z.object({
  name: z.string(),
  address: z.string(),
  userId: z.string(),
  searchAddress: z.string(),
  longitude: z.number(),
  latitude: z.number(),
  logoUrl: z.string().optional(),
  isSite: z.boolean(),
});

/**
 * Schema for creating club in DB (DAL layer)
 */
export const createClubDbSchema = z.object({
  name: z.string(),
  address: z.string(),
  managerId: z.string(),
  logoUrl: z.string().optional(),
});

/**
 * Schema for updating a club
 */
export const updateClubSchema = z.object({
  id: z.cuid2(),
  name: z.string(),
  address: z.string(),
  logoUrl: z.string().nullable(),
});

/**
 * Schema for updating club in DB (DAL layer)
 */
export const updateClubDbSchema = z.object({
  id: z.cuid2(),
  name: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  convexRoomId: z.string().nullable().optional(),
});

/**
 * Schema for updating club activities
 */
export const updateClubActivitiesSchema = z.object({
  clubId: z.cuid2(),
  activityIds: z.array(z.cuid2()),
});

// ==================== INFERRED TYPES ====================

export type Club = z.infer<typeof clubSchema>;
export type CreateClubInput = z.infer<typeof createClubSchema>;
export type CreateClubDbInput = z.infer<typeof createClubDbSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
export type UpdateClubDbInput = z.infer<typeof updateClubDbSchema>;
export type UpdateClubActivitiesInput = z.infer<typeof updateClubActivitiesSchema>;

