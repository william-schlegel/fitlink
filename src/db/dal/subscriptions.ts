import { asc, eq, inArray } from "drizzle-orm";

import { subscriptionModeEnum, subscriptionRestrictionEnum } from "@/db/schema/enums";
import { activityGroup, club, room, site, activity } from "@/db/schema/club";
import { subscription } from "@/db/schema/subscription";
import { isCUID } from "@/lib/utils";
import { db } from "@/db";

// ==================== SUBSCRIPTION QUERIES ====================

export async function getSubscriptionById(id: string) {
  return db.query.subscription.findFirst({
    where: eq(subscription.id, id),
    with: {
      sites: true,
      rooms: true,
      activities: true,
      activitieGroups: true,
      users: true,
    },
  });
}

export async function getSubscriptionsForClub(clubId: string) {
  if (!isCUID(clubId)) return [];
  return db.query.subscription.findMany({
    where: eq(subscription.clubId, clubId),
    orderBy: asc(subscription.startDate),
  });
}

// ==================== SUBSCRIPTION MUTATIONS ====================

export async function createSubscription(data: {
  name: string;
  highlight: string;
  description: string;
  startDate: Date;
  monthly: number;
  yearly: number;
  cancelationFee: number;
  clubId: string;
  mode: (typeof subscriptionModeEnum.enumValues)[number];
  restriction: (typeof subscriptionRestrictionEnum.enumValues)[number];
}) {
  return db.insert(subscription).values(data).returning();
}

export async function updateSubscription(data: {
  id: string;
  name?: string;
  highlight?: string;
  description?: string;
  startDate?: Date;
  monthly?: number;
  yearly?: number;
  cancelationFee?: number;
  clubId?: string;
  mode?: (typeof subscriptionModeEnum.enumValues)[number];
  restriction?: (typeof subscriptionRestrictionEnum.enumValues)[number];
}) {
  return db
    .update(subscription)
    .set(data)
    .where(eq(subscription.id, data.id))
    .returning();
}

export async function deleteSubscription(id: string) {
  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.id, id),
    with: { users: { columns: { userId: true } } },
  });

  if (!sub) return null;

  if (sub.users.length > 0) {
    return db
      .update(subscription)
      .set({ deletionDate: new Date(Date.now()) })
      .where(eq(subscription.id, id))
      .returning();
  } else {
    return db
      .delete(subscription)
      .where(eq(subscription.id, id))
      .returning();
  }
}

// ==================== DATA NAMES HELPER ====================

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

// ==================== POSSIBLE CHOICES ====================

export async function getClubWithActivities(clubId: string) {
  return db.query.club.findFirst({
    where: eq(club.id, clubId),
    with: {
      activities: {
        with: {
          group: true,
        },
      },
    },
  });
}

export async function getSitesWithRoomActivities(siteIds: string[]) {
  return db.query.site.findMany({
    where: inArray(site.id, siteIds),
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
}

export async function getRoomsWithActivities(roomIds: string[]) {
  return db.query.room.findMany({
    where: inArray(room.id, roomIds),
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
}

export async function getActivitiesListForClub(clubId: string) {
  return db.query.activity.findMany({
    where: eq(activity.clubId, clubId),
  });
}

export async function getSitesWithRoomActivitiesBasic(siteIds: string[]) {
  return db.query.site.findMany({
    where: inArray(site.id, siteIds),
    with: {
      rooms: {
        with: {
          activities: {
            with: {
              activity: true,
            },
          },
        },
      },
    },
  });
}

export async function getRoomsWithActivitiesBasic(roomIds: string[]) {
  return db.query.room.findMany({
    where: inArray(room.id, roomIds),
    with: {
      activities: {
        with: {
          activity: true,
        },
      },
    },
  });
}

