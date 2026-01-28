import { z } from "zod";

import {
  createRoom,
  createSite,
  deleteRoom,
  deleteSite,
  getRoomById,
  getRoomsForSite,
  getSiteById,
  getSitesForClub,
  getSitesFromDistance,
  getUserWithPricingForSites,
  updateRoom,
  updateSite,
} from "@/db/dal";
import {
  ClubId,
  SiteId,
  UserId,
  ZodClubId,
  ZodRoomId,
  ZodSiteId,
} from "@/db/types";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { calculateDistance } from "@/lib/distance";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import {
  roomSchema,
  siteSchema,
  updateRoomSchema,
  updateSiteSchema,
} from "@/schemas/sites";

// Export functions for use in server components
export { getRoomById, getRoomsForSite, getSiteById, getSitesForClub };

export async function getSitesForClubWithLimit(clubId: ClubId, userId: UserId) {
  const u = await getUserWithPricingForSites(userId);
  const limit = u?.pricing?.features.find(
    (f) => f.feature === "MANAGER_MULTI_SITE",
  )
    ? undefined
    : 1;

  return getSitesForClub(clubId, limit);
}

export async function getRoomsForSiteWithCheck(siteId: SiteId, userId: UserId) {
  const u = await getUserWithPricingForSites(userId);
  if (!u?.pricing?.features.find((f) => f.feature === "MANAGER_ROOM"))
    return [];

  return getRoomsForSite(siteId);
}

export const siteRouter = createTRPCRouter({
  getSiteById: protectedProcedure
    .input(ZodSiteId)
    .query(({ input }) => getSiteById(input)),

  getSitesForClub: protectedProcedure
    .input(ZodClubId)
    .query(async ({ ctx, input }) =>
      getSitesForClubWithLimit(input, ctx.user.id as UserId),
    ),

  createSite: protectedProcedure
    .input(siteSchema.omit({ id: true }))
    .mutation(({ input }) => createSite(input)),

  updateSite: protectedProcedure
    .input(updateSiteSchema)
    .mutation(({ input }) => updateSite(input)),

  deleteSite: protectedProcedure
    .input(ZodSiteId)
    .mutation(({ input }) => deleteSite(input)),

  /** ------------------- ROOMS -------------------- **/
  getRoomById: protectedProcedure
    .input(ZodRoomId)
    .query(({ input }) => getRoomById(input)),

  getRoomsForSite: protectedProcedure
    .input(ZodSiteId)
    .query(async ({ ctx, input }) =>
      getRoomsForSiteWithCheck(input, ctx.user.id as UserId),
    ),

  createRoom: protectedProcedure
    .input(roomSchema.omit({ id: true }))
    .mutation(({ input }) => createRoom(input)),

  updateRoom: protectedProcedure
    .input(updateRoomSchema)
    .mutation(({ input }) => updateRoom(input)),

  deleteRoom: protectedProcedure
    .input(ZodRoomId)
    .mutation(({ input }) => deleteRoom(input)),

  getSitesFromDistance: publicProcedure
    .input(
      z.object({
        locationLng: z.number().default(LONGITUDE),
        locationLat: z.number().default(LATITUDE),
        range: z.number().max(100).default(25),
      }),
    )
    .query(async ({ input }) => {
      const sites = await getSitesFromDistance(
        input.locationLng,
        input.locationLat,
        input.range,
      );
      return sites
        .map((site) => ({
          ...site,
          distance: calculateDistance(
            input.locationLng,
            input.locationLat,
            site.longitude ?? 0,
            site.latitude ?? 0,
          ),
        }))
        .filter((c) => c.distance <= input.range);
    }),
});
