import { and, asc, eq, gte, lte } from "drizzle-orm";

import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { roomReservationEnum } from "@/db/schema/enums";
import { calculateBBox } from "@/lib/distance";
import { room, site } from "@/db/schema/club";
import { user } from "@/db/schema/auth";
import { db } from "@/db";

// ==================== SITE QUERIES ====================

export async function getSiteById(id: string) {
  return db.query.site.findFirst({
    where: eq(site.id, id),
    with: { rooms: true },
  });
}

export async function getSitesForClub(clubId: string, limit?: number) {
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

export async function createSite(data: {
  clubId: string;
  name: string;
  address: string;
  searchAddress: string;
  longitude: number;
  latitude: number;
}) {
  return db
    .insert(site)
    .values({
      clubId: data.clubId,
      name: data.name,
      address: data.address,
      searchAddress: data.searchAddress,
      longitude: data.longitude,
      latitude: data.latitude,
    })
    .returning();
}

export async function updateSite(data: {
  id: string;
  name?: string;
  address?: string;
  searchAddress?: string;
  longitude?: number;
  latitude?: number;
}) {
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

export async function deleteSite(id: string) {
  return db.delete(site).where(eq(site.id, id));
}

// ==================== ROOM QUERIES ====================

export async function getRoomById(roomId: string) {
  return db.query.room.findFirst({
    where: eq(room.id, roomId),
  });
}

export async function getRoomsForSite(siteId: string) {
  return db.query.room.findMany({
    where: eq(room.siteId, siteId),
    orderBy: [asc(room.name)],
  });
}

// ==================== ROOM MUTATIONS ====================

export async function createRoom(data: {
  siteId: string;
  name: string;
  reservation: (typeof roomReservationEnum.enumValues)[number];
  capacity: number;
  unavailable: boolean;
  openWithClub?: boolean;
  openWithSite?: boolean;
}) {
  return db
    .insert(room)
    .values({
      siteId: data.siteId,
      name: data.name,
      reservation: data.reservation,
      capacity: data.capacity,
      unavailable: data.unavailable,
      openWithClub: data.openWithClub ?? true,
      openWithSite: data.openWithSite ?? true,
    })
    .returning();
}

export async function updateRoom(data: {
  id: string;
  siteId?: string;
  name?: string;
  reservation?: (typeof roomReservationEnum.enumValues)[number];
  capacity?: number;
  unavailable?: boolean;
  openWithClub?: boolean;
  openWithSite?: boolean;
}) {
  return db
    .update(room)
    .set(data)
    .where(eq(room.id, data.id))
    .returning();
}

export async function deleteRoom(id: string) {
  return db.delete(room).where(eq(room.id, id));
}

// ==================== USER PRICING CHECK ====================

export async function getUserWithPricingForSites(userId: string) {
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

