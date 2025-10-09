import { and, asc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { pricing, pricingFeature } from "@/db/schema/subscription";
import { calculateBBox, calculateDistance } from "@/lib/distance";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { roomReservationEnum } from "@/db/schema/enums";
import { room, site } from "@/db/schema/club";
import { user } from "@/db/schema/auth";
import { db } from "@/db";

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

export async function getSitesForClub(clubId: string, userId: string) {
  const u = await db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      pricing: {
        with: {
          features: true,
        },
      },
    },
  });

  const limit = u?.pricing?.features.find(
    (f) => f.feature === "MANAGER_MULTI_SITE",
  )
    ? undefined
    : 1;

  return db.query.site.findMany({
    where: eq(site.clubId, clubId),
    with: { rooms: true },
    orderBy: [asc(site.name)],
    limit,
  });
}

export async function getSiteById(id: string) {
  return db.query.site.findFirst({
    where: eq(site.id, id),
    with: { rooms: true },
  });
}

export async function getRoomsForSite(siteId: string, userId: string) {
  // check user rights
  const u = await db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      pricing: {
        with: {
          features: true,
        },
      },
    },
  });
  if (!u?.pricing?.features.find((f) => f.feature === "MANAGER_ROOM"))
    return [];

  return db.query.room.findMany({
    where: eq(room.siteId, siteId),
    orderBy: [asc(room.name)],
  });
}

export async function getRoomById(roomId: string) {
  return db.query.room.findFirst({
    where: eq(room.id, roomId),
  });
}

export const siteRouter = createTRPCRouter({
  getSiteById: protectedProcedure.input(z.cuid2()).query(({ input }) => {
    return getSiteById(input);
  }),
  getSitesForClub: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => await getSitesForClub(input, ctx.user.id)),
  createSite: protectedProcedure
    .input(SiteObject.omit({ id: true }))
    .mutation(({ input }) =>
      db
        .insert(site)
        .values({
          clubId: input.clubId,
          name: input.name,
          address: input.address,
          searchAddress: input.searchAddress,
          longitude: input.longitude,
          latitude: input.latitude,
        })
        .returning(),
    ),
  updateSite: protectedProcedure
    .input(SiteObject.partial())
    .mutation(({ input }) => {
      return db
        .update(site)
        .set({
          name: input.name,
          address: input.address,
          searchAddress: input.searchAddress,
          longitude: input.longitude,
          latitude: input.latitude,
        })
        .where(eq(site.id, input.id!));
    }),
  // updateSiteCalendar: protectedProcedure
  //   .input(
  //     z.object({
  //       id: z.string().cuid2(),
  //       calendarId: z.string().cuid2(),
  //     })
  //   )
  //   .mutation(({ ctx, input }) =>
  //     ctx.prisma.site.update({
  //       where: { id: input.id },
  //       data: {
  //         calendars: { connect: { id: input.calendarId } },
  //       },
  //     })
  //   ),
  deleteSite: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) => db.delete(site).where(eq(site.id, input))),
  /**  ------------------- ROOMS -------------------- **/
  getRoomById: protectedProcedure
    .input(z.cuid2())
    .query(async ({ input }) => await getRoomById(input)),
  getRoomsForSite: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => await getRoomsForSite(input, ctx.user.id)),

  createRoom: protectedProcedure
    .input(RoomObject.omit({ id: true }))
    .mutation(({ input }) =>
      db
        .insert(room)
        .values({ ...input })
        .returning(),
    ),
  updateRoom: protectedProcedure
    .input(RoomObject.partial())
    .mutation(({ input }) => {
      return db
        .update(room)
        .set(input)
        .where(eq(room.id, input.id!))
        .returning();
    }),
  deleteRoom: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) => db.delete(room).where(eq(room.id, input))),
  // updateRoomCalendar: protectedProcedure
  //   .input(
  //     z.object({
  //       id: z.string().cuid2(),
  //       openWithClub: z.boolean().optional(),
  //       openWithSite: z.boolean().optional(),
  //       calendarId: z.string().cuid2().optional(),
  //     })
  //   )
  //   .mutation(({ ctx, input }) =>
  //     ctx.prisma.room.update({
  //       where: { id: input.id },
  //       data: {
  //         calendars: { connect: { id: input.calendarId } },
  //       },
  //     })
  //   ),
  getSitesFromDistance: publicProcedure
    .input(
      z.object({
        locationLng: z.number().default(LONGITUDE),
        locationLat: z.number().default(LATITUDE),
        range: z.number().max(100).default(25),
      }),
    )
    .query(async ({ input }) => {
      const bbox = calculateBBox(
        input.locationLng,
        input.locationLat,
        input.range,
      );
      const sites = await db.query.site.findMany({
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
