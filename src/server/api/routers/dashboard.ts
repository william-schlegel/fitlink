import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { club, event } from "@/db/schema/club";
import { hasRole, isAdmin } from "@/server/lib/userTools";
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

export async function getManagerDataForUserId(userId: string) {
  await hasRole(["MANAGER", "MANAGER_COACH", "ADMIN"], true);
  const clubData = await db.query.club.findMany({
    where: eq(club.managerId, userId),
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
}

export async function getCoachDataForUserId(userId: string) {
  await hasRole(["COACH", "MANAGER_COACH", "ADMIN"], true);

  const coachData = await db.query.user.findFirst({
    where: eq(user.id, userId),
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
  return coachData;
}

export const dashboardRouter = createTRPCRouter({
  getManagerDataForUserId: protectedProcedure
    .input(z.string())
    .query(({ input }) => getManagerDataForUserId(input)),
  getCoachDataForUserId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {}),
  getAdminData: protectedProcedure.query(async () => getAdminData()),
});
