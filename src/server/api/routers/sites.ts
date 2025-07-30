import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { RoomReservation } from "@prisma/client";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { db } from "@/db";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { room, site } from "@/db/schema/club";
import { calculateBBox, calculateDistance } from "@/lib/distance";
import { user } from "@/db/schema/auth";
import { pricing, pricingFeature } from "@/db/schema/subscription";

const SiteObject = z.object({
  id: z.cuid(),
  clubId: z.cuid(),
  name: z.string(),
  address: z.string(),
  searchAddress: z.string(),
  longitude: z.number(),
  latitude: z.number(),
});

const RoomObject = z.object({
  id: z.cuid(),
  siteId: z.cuid(),
  name: z.string(),
  reservation: z.enum(RoomReservation),
  capacity: z.number(),
  unavailable: z.boolean(),
  openWithClub: z.boolean().default(true),
  openWithSite: z.boolean().default(true),
});

export const siteRouter = createTRPCRouter({
  getSiteById: protectedProcedure.input(z.cuid()).query(({ input }) => {
    return db.query.site.findFirst({
      where: eq(site.id, input),
      with: { rooms: true },
    });
  }),
  getSitesForClub: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const u = await db.query.user.findFirst({
        where: eq(user.id, ctx.user.id),
        with: {
          pricing: {
            with: {
              features: true,
            },
          },
        },
      });

      const limit = u?.pricing?.features.find(
        (f) => f.feature === "MANAGER_MULTI_SITE"
      )
        ? undefined
        : 1;

      return db.query.site.findMany({
        where: eq(site.clubId, input),
        with: { rooms: true },
        orderBy: [asc(site.name)],
        limit,
      });
    }),
  // createSite: protectedProcedure
  //   .input(SiteObject.omit({ id: true }))
  //   .mutation(({ ctx, input }) =>
  //     ctx.prisma.site.create({
  //       data: {
  //         clubId: input.clubId,
  //         name: input.name,
  //         address: input.address,
  //         searchAddress: input.searchAddress,
  //         longitude: input.longitude,
  //         latitude: input.latitude,
  //       },
  //     })
  //   ),
  // updateSite: protectedProcedure
  //   .input(SiteObject.partial())
  //   .mutation(({ ctx, input }) => {
  //     return ctx.prisma.site.update({
  //       where: { id: input.id },
  //       data: {
  //         name: input.name,
  //         address: input.address,
  //         searchAddress: input.searchAddress,
  //         longitude: input.longitude,
  //         latitude: input.latitude,
  //       },
  //     });
  //   }),
  // updateSiteCalendar: protectedProcedure
  //   .input(
  //     z.object({
  //       id: z.string().cuid(),
  //       calendarId: z.string().cuid(),
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
  // deleteSite: protectedProcedure
  //   .input(z.string().cuid())
  //   .mutation(({ ctx, input }) =>
  //     ctx.prisma.site.delete({ where: { id: input } })
  //   ),
  /**  ------------------- ROOMS -------------------- **/
  getRoomById: protectedProcedure.input(z.cuid()).query(({ input }) => {
    return db.query.room.findFirst({
      where: eq(room.id, input),
    });
  }),
  getRoomsForSite: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // check user rights
      const u = await db.query.user.findFirst({
        where: eq(user.id, ctx.user.id),
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
        where: eq(room.siteId, input),
        orderBy: [asc(room.name)],
      });
    }),

  // createRoom: protectedProcedure
  //   .input(RoomObject.omit({ id: true }))
  //   .mutation(({ ctx, input }) =>
  //     ctx.prisma.room.create({
  //       data: { ...input },
  //     })
  //   ),
  // updateRoom: protectedProcedure
  //   .input(RoomObject.partial())
  //   .mutation(({ ctx, input }) => {
  //     return ctx.prisma.room.update({
  //       where: { id: input.id },
  //       data: input,
  //     });
  //   }),
  // deleteRoom: protectedProcedure
  //   .input(z.string().cuid())
  //   .mutation(({ ctx, input }) =>
  //     ctx.prisma.room.delete({ where: { id: input } })
  //   ),
  // updateRoomCalendar: protectedProcedure
  //   .input(
  //     z.object({
  //       id: z.string().cuid(),
  //       openWithClub: z.boolean().optional(),
  //       openWithSite: z.boolean().optional(),
  //       calendarId: z.string().cuid().optional(),
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
      })
    )
    .query(async ({ input }) => {
      const bbox = calculateBBox(
        input.locationLng,
        input.locationLat,
        input.range
      );
      const sites = await db.query.site.findMany({
        where: and(
          gte(site.longitude, bbox?.[0]?.[0] ?? LONGITUDE),
          lte(site.longitude, bbox?.[1]?.[0] ?? LONGITUDE),
          gte(site.latitude, bbox?.[1]?.[1] ?? LATITUDE),
          lte(site.latitude, bbox?.[0]?.[1] ?? LATITUDE)
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
            site.latitude ?? 0
          ),
        }))
        .filter((c) => c.distance <= input.range);
    }),
});
