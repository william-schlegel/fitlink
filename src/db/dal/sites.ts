import { and, asc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { room, site } from "@/db/schema/club";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { calculateBBox } from "@/lib/distance";

import type {
  CreateRoomInput,
  CreateSiteInput,
  UpdateRoomInput,
  UpdateSiteInput,
} from "@/schemas/sites";
import { ClubId, RoomId, SiteId, UserId } from "../types";

// ==================== SITE QUERIES ====================

export async function getSiteById(id: SiteId) {
  return db.query.site.findFirst({
    where: eq(site.id, id),
    with: { rooms: true },
  });
}

export async function getSitesForClub(clubId: ClubId, limit?: number) {
  return db.query.site.findMany({
    where: eq(site.clubId, clubId),
    with: { rooms: true },
    orderBy: [asc(site.name)],
    limit,
  });
}

export async function getSitesFromDistance(
  locationLng: number = LONGITUDE,
  locationLat: number = LATITUDE,
  range: number = 25,
) {
  const bbox = calculateBBox(locationLng, locationLat, range);
  return db.query.site.findMany({
    where: and(
      gte(site.longitude, bbox?.[0]?.[0] ?? LONGITUDE),
      lte(site.longitude, bbox?.[1]?.[0] ?? LONGITUDE),
      gte(site.latitude, bbox?.[1]?.[1] ?? LATITUDE),
      lte(site.latitude, bbox?.[0]?.[1] ?? LATITUDE),
    ),
    with: {
      club: {
        with: { activities: { with: { group: true } }, pages: true },
      },
    },
  });
}

// ==================== SITE MUTATIONS ====================

export async function createSite(data: CreateSiteInput) {
  return db.insert(site).values(data).returning();
}

export async function updateSite(data: UpdateSiteInput) {
  return db
    .update(site)
    .set({
      name: data.name,
      address: data.address,
      searchAddress: data.searchAddress,
      longitude: data.longitude,
      latitude: data.latitude,
    })
    .where(eq(site.id, data.id))
    .returning();
}

export async function deleteSite(id: SiteId) {
  return db.delete(site).where(eq(site.id, id));
}

// ==================== ROOM QUERIES ====================

export async function getRoomById(roomId: RoomId) {
  return db.query.room.findFirst({
    where: eq(room.id, roomId),
  });
}

export async function getRoomsForSite(siteId: SiteId) {
  return db.query.room.findMany({
    where: eq(room.siteId, siteId),
    orderBy: [asc(room.name)],
  });
}

// ==================== ROOM MUTATIONS ====================

export async function createRoom(data: CreateRoomInput) {
  return db
    .insert(room)
    .values({
      ...data,
      openWithClub: data.openWithClub ?? true,
      openWithSite: data.openWithSite ?? true,
    })
    .returning();
}

export async function updateRoom(data: UpdateRoomInput) {
  return db.update(room).set(data).where(eq(room.id, data.id)).returning();
}

export async function deleteRoom(id: RoomId) {
  return db.delete(room).where(eq(room.id, id));
}

// ==================== USER PRICING CHECK ====================

export async function getUserWithPricingForSites(userId: UserId) {
  return db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      pricing: {
        with: {
          features: true,
        },
      },
    },
  });
}
