import z from "zod";

import {
  addCoachToClub,
  createSiteForClub,
  createClub as dalCreateClub,
  deleteClub as dalDeleteClub,
  getClubById as dalGetClubById,
  updateClub as dalUpdateClub,
  updateClubActivities as dalUpdateClubActivities,
  updateClubCalendar as dalUpdateClubCalendar,
  getAllClubs,
  getClubCoachRelation,
  getClubForUpdate,
  getClubPagesForNav,
  getClubsForManager,
  getUserWithPricingFeatures,
  updateClubConvexRoomId,
} from "@/db/dal";
import { ZodUserId } from "@/db/types";
import { createClubRoomInConvex } from "@/lib/convex/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import {
  requireAdminOrOwner,
  requireAdminOrSelf,
} from "@/server/lib/userTools";

export const clubRouter = createTRPCRouter({
  getClubById: protectedProcedure
    .input(z.object({ clubId: z.cuid2(), userId: ZodUserId }))
    .query(async ({ input }) => {
      if (!input.clubId || !input.userId) return null;
      const userData = await getUserWithPricingFeatures(input.userId);
      const siteLimit: number | undefined = userData?.pricing?.features.find(
        (f) => f.feature === "MANAGER_MULTI_SITE",
      )
        ? undefined
        : 1;
      return dalGetClubById(input.clubId, siteLimit);
    }),

  getClubPagesForNavByClubId: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const myClub = await getClubPagesForNav(input);
      if (!myClub) return { pages: [], logoUrl: "" };
      return {
        pages: myClub.pages.map((p) => ({
          id: p.id,
          name: p.name,
          target: p.target,
          sections: p.sections.map((s) => ({
            id: s.id,
            model: s.model,
            title: s.title,
          })),
        })),
        managerId: myClub.managerId,
        logoUrl: myClub.logoUrl,
      };
    }),

  getClubsForManager: protectedProcedure
    .input(ZodUserId)
    .query(async ({ input }) => {
      const userData = await getUserWithPricingFeatures(input);
      const take = userData?.pricing?.features.find(
        (f) => f.feature === "MANAGER_MULTI_CLUB",
      )
        ? undefined
        : 1;
      return getClubsForManager(input, take);
    }),

  getAllClubs: publicProcedure.query(() => getAllClubs()),

  createClub: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        address: z.string(),
        userId: ZodUserId,
        searchAddress: z.string(),
        longitude: z.number(),
        latitude: z.number(),
        logoUrl: z.string().optional(),
        isSite: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdminOrSelf(ctx.user, input.userId);

      const clb = await dalCreateClub({
        name: input.name,
        address: input.address,
        managerId: input.userId,
        logoUrl: input.logoUrl,
      });

      // create Convex room for real-time chat
      const convexRoomId = await createClubRoomInConvex(
        clb[0].id,
        input.name,
        input.userId,
      );

      // Update club with Convex room ID
      if (convexRoomId) {
        await updateClubConvexRoomId(clb[0].id, String(convexRoomId));
        clb[0].convexRoomId = String(convexRoomId);
      }

      if (input.isSite) {
        await createSiteForClub({
          clubId: clb[0].id,
          name: input.name,
          address: input.address,
          searchAddress: input.searchAddress,
          longitude: input.longitude,
          latitude: input.latitude,
        });
      }

      return clb[0];
    }),

  updateClub: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        name: z.string(),
        address: z.string(),
        logoUrl: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const initialClub = await getClubForUpdate(input.id);
      requireAdminOrOwner(ctx.user, initialClub?.managerId);

      let convexRoomId: string | null | undefined;
      if (initialClub && !initialClub.convexRoomId) {
        convexRoomId = await createClubRoomInConvex(
          initialClub.id,
          initialClub.name,
          initialClub.managerId,
        );
      }

      return dalUpdateClub({
        id: input.id,
        name: input.name,
        address: input.address,
        logoUrl: input.logoUrl,
        convexRoomId: convexRoomId ?? undefined,
      });
    }),

  updateClubCalendar: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        calendarId: z.cuid2(),
      }),
    )
    .mutation(({ input }) => dalUpdateClubCalendar(input.id, input.calendarId)),

  deleteClub: protectedProcedure
    .input(z.cuid2())
    .mutation(async ({ ctx, input }) => {
      const deletedClub = await getClubForUpdate(input);
      requireAdminOrOwner(ctx.user, deletedClub?.managerId);
      return dalDeleteClub(input);
    }),

  updateClubActivities: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        activities: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const initialClub = await getClubForUpdate(input.id);
      requireAdminOrOwner(ctx.user, initialClub?.managerId);
      return dalUpdateClubActivities(input.id, input.activities);
    }),

  updateClubCoach: protectedProcedure
    .input(
      z.object({
        clubId: z.cuid2(),
        coachUserId: ZodUserId,
        managerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const coachId = input.coachUserId;
      requireAdminOrOwner(ctx.user, coachId);

      const existing = await getClubCoachRelation(
        input.clubId,
        input.coachUserId,
      );
      if (existing) return existing;

      const newCoach = await addCoachToClub(input.clubId, input.coachUserId);
      return newCoach;
    }),
});
