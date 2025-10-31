import { asc, eq, inArray } from "drizzle-orm";
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
import { activityGroup, club, room, site } from "@/db/schema/club";
import { subscription } from "@/db/schema/subscription";
import { activity } from "@/db/schema/club";
import { isCUID } from "@/lib/utils";
import { db } from "@/db";

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
  const sites = await db.query.site.findMany({
    where: inArray(site.id, siteIds),
    columns: { id: true, name: true },
  });
  const rooms = await db.query.room.findMany({
    where: inArray(room.id, roomIds),
    columns: { id: true, name: true },
  });
  const activityGroups = await db.query.activityGroup.findMany({
    where: inArray(activityGroup.id, activityGroupIds),
    columns: { id: true, name: true },
  });
  const activities = await db.query.activity.findMany({
    where: inArray(activity.id, activityIds),
    columns: { id: true, name: true },
  });
  return { sites, rooms, activityGroups, activities };
}

export async function getSubscriptionsForClub(clubId: string) {
  if (!isCUID(clubId)) return [];
  return db.query.subscription.findMany({
    where: eq(subscription.clubId, clubId),
    orderBy: asc(subscription.startDate),
  });
}

export const subscriptionRouter = createTRPCRouter({
  getSubscriptionById: publicProcedure.input(z.cuid2()).query(({ input }) => {
    return db.query.subscription.findFirst({
      where: eq(subscription.id, input),
      with: {
        sites: true,
        rooms: true,
        activities: true,
        activitieGroups: true,
        users: true,
      },
    });
  }),
  getSubscriptionsForClub: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => getSubscriptionsForClub(input)),
  createSubscription: protectedProcedure
    .input(subscriptionObject.omit({ id: true }))
    .mutation(({ input }) => db.insert(subscription).values(input).returning()),

  updateSubscription: protectedProcedure
    .input(subscriptionObject.partial())
    .mutation(({ input }) =>
      db
        .update(subscription)
        .set(input)
        .where(eq(subscription.id, input.id!))
        .returning(),
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
      // return db.query.subscription.update({
      //   where: eq(subscription.id, input.subscriptionId),
      //   data: {
      //     sites: { connect: input.sites.map((id) => ({ id })) },
      //     rooms: { connect: input.rooms.map((id) => ({ id })) },
      //     activitieGroups: {
      //       connect: input.activityGroups.map((id) => ({ id })),
      //     },
      //     activities: { connect: input.activities.map((id) => ({ id })) },
      //   },
      // });
    }),
  deleteSubscription: protectedProcedure
    .input(z.cuid2())
    .mutation(async ({ input }) => {
      const sub = await db.query.subscription.findFirst({
        where: eq(subscription.id, input),
        with: { users: { columns: { userId: true } } },
      });
      if (!sub)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `unknown subscription ${input}`,
        });
      if (sub.users.length > 0) {
        return db
          .update(subscription)
          .set({
            deletionDate: new Date(Date.now()),
          })
          .where(eq(subscription.id, input))
          .returning();
      } else {
        return db
          .delete(subscription)
          .where(eq(subscription.id, input))
          .returning();
      }
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
          const clubData = await db.query.club.findFirst({
            where: eq(club.id, input.clubId),
            with: {
              activities: {
                with: {
                  group: true,
                },
              },
            },
          });
          const activityGroups = new Map<
            string,
            typeof activityGroup.$inferSelect
          >();
          for (const activity of clubData?.activities ?? [])
            activityGroups.set(activity.groupId, activity.group);

          return { activityGroups: Array.from(activityGroups.values()) };
        }
        if (input.restriction === "SITE") {
          const sites = await db.query.site.findMany({
            where: inArray(site.id, input.siteIds),
            with: {
              rooms: {
                with: {
                  activities: {
                    with: {
                      activity: {
                        with: {
                          group: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });
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
          const rooms = await db.query.room.findMany({
            where: inArray(room.id, input.roomIds),
            with: {
              activities: {
                with: {
                  activity: {
                    with: {
                      group: true,
                    },
                  },
                },
              },
            },
          });
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
          const activities = await db.query.activity.findMany({
            where: eq(activity.clubId, input.clubId),
          });
          return { activities };
        }
        if (input.restriction === "SITE") {
          const sites = await db.query.site.findMany({
            where: inArray(site.id, input.siteIds),
            with: {
              rooms: {
                with: {
                  activities: true,
                },
              },
            },
          });
          const activities = new Map<
            string,
            Partial<typeof activity.$inferSelect>
          >();
          for (const site of sites)
            for (const room of site.rooms)
              for (const activity of room.activities)
                activities.set(activity.id, activity);
          return { activities: Array.from(activities.values()) };
        }
        if (input.restriction === "ROOM") {
          const rooms = await db.query.room.findMany({
            where: inArray(room.id, input.roomIds),
            with: {
              activities: true,
            },
          });
          const activities = new Map<
            string,
            Partial<typeof activity.$inferSelect>
          >();
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
