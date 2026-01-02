import { z } from "zod";

import { roomReservationEnum } from "@/db/schema/enums";

// ==================== SITE SCHEMAS ====================

/**
 * Base site schema with all fields
 */
export const siteSchema = z.object({
  id: z.cuid2(),
  clubId: z.cuid2(),
  name: z.string(),
  address: z.string(),
  searchAddress: z.string(),
  longitude: z.number(),
  latitude: z.number(),
});

/**
 * Schema for creating a new site
 */
export const createSiteSchema = siteSchema.omit({ id: true });

/**
 * Schema for updating a site
 */
export const updateSiteSchema = siteSchema.partial().extend({
  id: z.cuid2(),
});

// ==================== ROOM SCHEMAS ====================

/**
 * Base room schema with all fields
 */
export const roomSchema = z.object({
  id: z.cuid2(),
  siteId: z.cuid2(),
  name: z.string(),
  reservation: z.enum(roomReservationEnum.enumValues),
  capacity: z.number(),
  unavailable: z.boolean(),
  openWithClub: z.boolean().default(true),
  openWithSite: z.boolean().default(true),
});

/**
 * Schema for creating a new room
 */
export const createRoomSchema = roomSchema.omit({ id: true });

/**
 * Schema for updating a room
 */
export const updateRoomSchema = roomSchema.partial().extend({
  id: z.cuid2(),
});

// ==================== INFERRED TYPES ====================

export type Site = z.infer<typeof siteSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;

export type Room = z.infer<typeof roomSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
