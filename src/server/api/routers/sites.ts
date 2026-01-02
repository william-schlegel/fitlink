import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { calculateDistance } from "@/lib/distance";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { roomReservationEnum } from "@/db/schema/enums";
import {
  getSiteById,
  getSitesForClub,
  getSitesFromDistance,
  createSite,
  updateSite,
  deleteSite,
  getRoomById,
  getRoomsForSite,
  createRoom,
  updateRoom,
  deleteRoom,
  getUserWithPricingForSites,
} from "@/db/dal";

const SiteObject = z.object({
  id: z.cuid2(),
  clubId: z.cuid2(),
  name: z.string(),
  address: z.string(),
  searchAddress: z.string(),
  longitude: z.number(),
  latitude: z.number(),
});

const RoomObject = z.object({
  id: z.cuid2(),
  siteId: z.cuid2(),
  name: z.string(),
  reservation: z.enum(roomReservationEnum.enumValues),
  capacity: z.number(),
  unavailable: z.boolean(),
  openWithClub: z.boolean().default(true),
  openWithSite: z.boolean().default(true),
});

export async function getSitesForClubWithLimit(clubId: string, userId: string) {
  const u = await getUserWithPricingForSites(userId);
  const limit = u?.pricing?.features.find(
    (f) => f.feature === "MANAGER_MULTI_SITE",
  )
    ? undefined
    : 1;

  return getSitesForClub(clubId, limit);
}

export async function getRoomsForSiteWithCheck(siteId: string, userId: string) {
  const u = await getUserWithPricingForSites(userId);
  if (!u?.pricing?.features.find((f) => f.feature === "MANAGER_ROOM"))
    return [];

  return getRoomsForSite(siteId);
}

export const siteRouter = createTRPCRouter({
  getSiteById: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => getSiteById(input)),

  getSitesForClub: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) =>
      getSitesForClubWithLimit(input, ctx.user.id),
    ),

  createSite: protectedProcedure
    .input(SiteObject.omit({ id: true }))
    .mutation(({ input }) => createSite(input)),

  updateSite: protectedProcedure
    .input(SiteObject.partial())
    .mutation(({ input }) => updateSite({ id: input.id ?? "", ...input })),

  deleteSite: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) => deleteSite(input)),

  /** ------------------- ROOMS -------------------- **/
  getRoomById: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => getRoomById(input)),

  getRoomsForSite: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) =>
      getRoomsForSiteWithCheck(input, ctx.user.id),
    ),

  createRoom: protectedProcedure
    .input(RoomObject.omit({ id: true }))
    .mutation(({ input }) => createRoom(input)),

  updateRoom: protectedProcedure
    .input(RoomObject.partial())
    .mutation(({ input }) => updateRoom({ id: input.id ?? "", ...input })),

  deleteRoom: protectedProcedure
    .input(z.cuid2())
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
