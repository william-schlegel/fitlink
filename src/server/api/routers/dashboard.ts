import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { club, event } from "@/db/schema/club";
import { isAdmin } from "@/server/lib/userTools";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { startOfToday } from "date-fns";
import { asc, eq, gte } from "drizzle-orm";
import { z } from "zod";

export async function getAdminData() {
  await isAdmin();
  const clubs = await db.query.club.findMany({
    with: {
      sites: {
        columns: { id: true },
        with: { rooms: { columns: { id: true } } },
      },
    },
  });
  const members = await db.query.user.findMany();
  return {
    clubs,
    members,
  };
}
export const dashboardRouter = createTRPCRouter({
  getManagerDataForUserId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (
        ctx.user.role !== "ADMIN" &&
        ctx.user.role !== "MANAGER" &&
        ctx.user.role !== "MANAGER_COACH"
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You cannot read manager data",
        });
      const clubData = await db.query.club.findMany({
        where: eq(club.managerId, input),
        with: {
          sites: {
            columns: { name: true },
            with: {
              rooms: {
                columns: {
                  name: true,
                },
              },
            },
          },
          activities: {
            columns: { name: true },
          },
          subscriptions: {
            columns: {
              name: true,
            },
            with: {
              users: {
                columns: {
                  userId: true,
                },
              },
            },
          },
          events: {
            where: gte(event.startDate, startOfToday()),
            orderBy: asc(event.startDate),
          },
        },
      });

      if (!clubData) return null;
      const memberSet = new Set<string>();
      let members = 0;
      const initialValue = {
        activities: 0,
        subscriptions: 0,
        sites: 0,
        rooms: 0,
      };
      const { activities, subscriptions, sites, rooms } = clubData.reduce(
        (acc, c) => {
          for (const s of c.subscriptions)
            for (const u of s.users) memberSet.add(u.userId);
          acc.subscriptions += c.subscriptions.length;
          acc.sites += c.sites.length;
          acc.rooms += c.sites.reduce((ss, s) => (ss += s.rooms.length), 0);
          acc.activities += c.activities.length;
          return acc;
        },
        initialValue
      );
      members = memberSet.size;

      return {
        clubs: clubData.map((c) => ({
          id: c.id,
          name: c.name,
          events: c.events.map((e) => ({
            id: e.id,
            name: e.name,
            startDate: e.startDate,
          })),
        })),
        clubCount: clubData.length,
        activities,
        subscriptions,
        sites,
        rooms,
        members,
      };
    }),
  getCoachDataForUserId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (
        ctx.user.role !== "ADMIN" &&
        ctx.user.role !== "COACH" &&
        ctx.user.role !== "MANAGER_COACH"
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You cannot read coach data",
        });
      const clubData = await db.query.user.findFirst({
        where: eq(user.id, input),
        with: {
          coachData: {
            with: {
              clubs: true,
              certifications: true,
              activityGroups: true,
              page: true,
              coachingPrices: true,
            },
          },
        },
      });
      return clubData;
    }),
  getAdminData: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "ADMIN")
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not admin",
      });
    return getAdminData();
  }),
});
