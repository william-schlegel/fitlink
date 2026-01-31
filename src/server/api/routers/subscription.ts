import { z } from "zod";

import {
  createSubscription as dalCreateSubscription,
  deleteSubscription as dalDeleteSubscription,
  getDataNames as dalGetDataNames,
  getSubscriptionById as dalGetSubscriptionById,
  getSubscriptionsForClub as dalGetSubscriptionsForClub,
  updateSubscription as dalUpdateSubscription,
  dalUpdateSubscriptionSelection,
  getActivitiesListForClub,
  getClubWithActivities,
  getRoomsWithActivities,
  getRoomsWithActivitiesBasic,
  getSitesWithRoomActivities,
  getSitesWithRoomActivitiesBasic,
} from "@/db/dal";
import { activityGroup } from "@/db/schema/club";
import {
  subscriptionModeEnum,
  subscriptionRestrictionEnum,
} from "@/db/schema/enums";
import {
  ActivityGroupId,
  ActivityId,
  ClubId,
  RoomId,
  SiteId,
  ZodActivityGroupId,
  ZodActivityId,
  ZodClubId,
  ZodRoomId,
  ZodSiteId,
  ZodSubscriptionId,
} from "@/db/types";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";

const subscriptionObject = z.object({
  id: ZodSubscriptionId,
  name: z.string(),
  highlight: z.string(),
  description: z.string(),
  startDate: z.date(),
  monthly: z.number(),
  yearly: z.number(),
  cancelationFee: z.number(),
  clubId: ZodClubId,
  mode: z.enum(subscriptionModeEnum.enumValues),
  restriction: z.enum(subscriptionRestrictionEnum.enumValues),
});

export async function getDataNames(
  siteIds: SiteId[],
  roomIds: RoomId[],
  activityGroupIds: ActivityGroupId[],
  activityIds: ActivityId[],
) {
  return dalGetDataNames(siteIds, roomIds, activityGroupIds, activityIds);
}

export async function getSubscriptionsForClub(clubId: ClubId) {
  return dalGetSubscriptionsForClub(clubId);
}

export const subscriptionRouter = createTRPCRouter({
  getSubscriptionById: publicProcedure
    .input(ZodSubscriptionId)
    .query(({ input }) => dalGetSubscriptionById(input)),

  getSubscriptionsForClub: protectedProcedure
    .input(ZodClubId)
    .query(({ input }) => getSubscriptionsForClub(input)),

  createSubscription: protectedProcedure
    .input(subscriptionObject.omit({ id: true }))
    .mutation(({ input }) => dalCreateSubscription(input)),

  updateSubscription: protectedProcedure
    .input(subscriptionObject.partial().extend({ id: ZodSubscriptionId }))
    .mutation(({ input }) => dalUpdateSubscription({ ...input })),

  updateSubscriptionSelection: protectedProcedure
    .input(
      z.object({
        subscriptionId: ZodSubscriptionId,
        sites: z.array(ZodSiteId),
        rooms: z.array(ZodRoomId),
        activityGroups: z.array(ZodActivityGroupId),
        activities: z.array(ZodActivityId),
      }),
    )
    .mutation(({ input }) => {
      dalUpdateSubscriptionSelection({ ...input });
    }),

  deleteSubscription: protectedProcedure
    .input(ZodSubscriptionId)
    .mutation(async ({ input }) => {
      return dalDeleteSubscription(input);
    }),

  getPossibleChoice: protectedProcedure
    .input(
      z.object({
        clubId: ZodClubId,
        mode: z.enum(subscriptionModeEnum.enumValues),
        restriction: z.enum(subscriptionRestrictionEnum.enumValues),
        siteIds: z.array(ZodSiteId),
        roomIds: z.array(ZodRoomId),
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
          const activities = await getActivitiesListForClub(input.clubId);
          return { activities };
        }
        if (input.restriction === "SITE") {
          const sites = await getSitesWithRoomActivitiesBasic(input.siteIds);
          const activities = new Map<string, { id: string; name: string }>();
          for (const site of sites)
            for (const room of site.rooms)
              for (const roomActivity of room.activities)
                if (roomActivity.activity)
                  activities.set(roomActivity.activity.id, {
                    id: roomActivity.activity.id,
                    name: roomActivity.activity.name,
                  });
          return { activities: Array.from(activities.values()) };
        }
        if (input.restriction === "ROOM") {
          const rooms = await getRoomsWithActivitiesBasic(input.roomIds);
          const activities = new Map<string, { id: string; name: string }>();
          for (const room of rooms)
            for (const roomActivity of room.activities)
              if (roomActivity.activity)
                activities.set(roomActivity.activity.id, {
                  id: roomActivity.activity.id,
                  name: roomActivity.activity.name,
                });
          return { activities: Array.from(activities.values()) };
        }
      }
      return {};
    }),

  getDataNames: publicProcedure
    .input(
      z.object({
        siteIds: z.array(ZodSiteId),
        roomIds: z.array(ZodRoomId),
        activityGroupIds: z.array(ZodActivityGroupId),
        activityIds: z.array(ZodActivityId),
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
