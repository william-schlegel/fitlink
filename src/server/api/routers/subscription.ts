import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import {
  subscriptionModeEnum,
  subscriptionRestrictionEnum,
} from "@/db/schema/enums";
import { activityGroup } from "@/db/schema/club";
import {
  getSubscriptionById as dalGetSubscriptionById,
  getSubscriptionsForClub as dalGetSubscriptionsForClub,
  createSubscription as dalCreateSubscription,
  updateSubscription as dalUpdateSubscription,
  deleteSubscription as dalDeleteSubscription,
  getDataNames as dalGetDataNames,
  getClubWithActivities,
  getSitesWithRoomActivities,
  getRoomsWithActivities,
  getActivitiesForClub,
  getSitesWithRoomActivitiesBasic,
  getRoomsWithActivitiesBasic,
} from "@/db/dal";

const subscriptionObject = z.object({
  id: z.cuid2(),
  name: z.string(),
  highlight: z.string(),
  description: z.string(),
  startDate: z.date(),
  monthly: z.number(),
  yearly: z.number(),
  cancelationFee: z.number(),
  clubId: z.cuid2(),
  mode: z.enum(subscriptionModeEnum.enumValues),
  restriction: z.enum(subscriptionRestrictionEnum.enumValues),
});

export async function getDataNames(
  siteIds: string[],
  roomIds: string[],
  activityGroupIds: string[],
  activityIds: string[],
) {
  return dalGetDataNames(siteIds, roomIds, activityGroupIds, activityIds);
}

export async function getSubscriptionsForClub(clubId: string) {
  return dalGetSubscriptionsForClub(clubId);
}

export const subscriptionRouter = createTRPCRouter({
  getSubscriptionById: publicProcedure
    .input(z.cuid2())
    .query(({ input }) => dalGetSubscriptionById(input)),

  getSubscriptionsForClub: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => getSubscriptionsForClub(input)),

  createSubscription: protectedProcedure
    .input(subscriptionObject.omit({ id: true }))
    .mutation(({ input }) => dalCreateSubscription(input)),

  updateSubscription: protectedProcedure
    .input(subscriptionObject.partial())
    .mutation(({ input }) =>
      dalUpdateSubscription({ id: input.id ?? "", ...input }),
    ),

  updateSubscriptionSelection: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.cuid2(),
        sites: z.array(z.cuid2()),
        rooms: z.array(z.cuid2()),
        activityGroups: z.array(z.cuid2()),
        activities: z.array(z.cuid2()),
      }),
    )
    .mutation(() => {
      return null;
    }),

  deleteSubscription: protectedProcedure
    .input(z.cuid2())
    .mutation(async ({ input }) => {
      const result = await dalDeleteSubscription(input);
      if (!result)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `unknown subscription ${input}`,
        });
      return result;
    }),

  getPossibleChoice: protectedProcedure
    .input(
      z.object({
        clubId: z.cuid2(),
        mode: z.enum(subscriptionModeEnum.enumValues),
        restriction: z.enum(subscriptionRestrictionEnum.enumValues),
        siteIds: z.array(z.cuid2()),
        roomIds: z.array(z.cuid2()),
      }),
    )
    .query(async ({ input }) => {
      if (input.mode === "ACTIVITY_GROUP") {
        if (input.restriction === "CLUB") {
          const clubData = await getClubWithActivities(input.clubId);
          const activityGroups = new Map<
            string,
            typeof activityGroup.$inferSelect
          >();
          for (const activity of clubData?.activities ?? [])
            activityGroups.set(activity.groupId, activity.group);

          return { activityGroups: Array.from(activityGroups.values()) };
        }
        if (input.restriction === "SITE") {
          const sites = await getSitesWithRoomActivities(input.siteIds);
          const activityGroups = new Map<
            string,
            typeof activityGroup.$inferSelect
          >();
          for (const site of sites)
            for (const room of site.rooms)
              for (const activity of room.activities)
                activityGroups.set(
                  activity.activity.groupId,
                  activity.activity.group,
                );

          return { activityGroups: Array.from(activityGroups.values()) };
        }

        if (input.restriction === "ROOM") {
          const rooms = await getRoomsWithActivities(input.roomIds);
          const activityGroups = new Map<
            string,
            typeof activityGroup.$inferSelect
          >();
          for (const room of rooms)
            for (const activity of room.activities)
              activityGroups.set(
                activity.activity.groupId,
                activity.activity.group,
              );

          return { activityGroups: Array.from(activityGroups.values()) };
        }
      }
      if (input.mode === "ACTIVITY") {
        if (input.restriction === "CLUB") {
          const activities = await getActivitiesForClub(input.clubId);
          return { activities };
        }
        if (input.restriction === "SITE") {
          const sites = await getSitesWithRoomActivitiesBasic(input.siteIds);
          const activities = new Map<string, { id: string }>();
          for (const site of sites)
            for (const room of site.rooms)
              for (const activity of room.activities)
                activities.set(activity.id, activity);
          return { activities: Array.from(activities.values()) };
        }
        if (input.restriction === "ROOM") {
          const rooms = await getRoomsWithActivitiesBasic(input.roomIds);
          const activities = new Map<string, { id: string }>();
          for (const room of rooms)
            for (const activity of room.activities)
              activities.set(activity.id, activity);
          return { activities: Array.from(activities.values()) };
        }
      }
      return {};
    }),

  getDataNames: publicProcedure
    .input(
      z.object({
        siteIds: z.array(z.cuid2()),
        roomIds: z.array(z.cuid2()),
        activityGroupIds: z.array(z.cuid2()),
        activityIds: z.array(z.cuid2()),
      }),
    )
    .query(async ({ input }) =>
      getDataNames(
        input.siteIds,
        input.roomIds,
        input.activityGroupIds,
        input.activityIds,
      ),
    ),
});
