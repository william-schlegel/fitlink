import { z } from "zod";

import {
  getAdminData as dalGetAdminData,
  getCoachDataForUserId as dalGetCoachData,
  getManagerDataForUserId as dalGetManagerData,
} from "@/db/dal";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";
import { hasRole, isAdmin } from "@/server/lib/userTools";

export async function getAdminData() {
  await isAdmin();
  return dalGetAdminData();
}

export async function getManagerDataForUserId(userId: string) {
  await hasRole(["MANAGER", "MANAGER_COACH", "ADMIN"], true);
  const clubData = await dalGetManagerData(userId);

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
    initialValue,
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
  return dalGetCoachData(userId);
}

export const dashboardRouter = createTRPCRouter({
  getManagerDataForUserId: protectedProcedure
    .input(z.string())
    .query(({ input }) => getManagerDataForUserId(input)),
  getCoachDataForUserId: protectedProcedure
    .input(z.string())
    .query(({ input }) => getCoachDataForUserId(input)),
  getAdminData: protectedProcedure.query(async () => getAdminData()),
});
