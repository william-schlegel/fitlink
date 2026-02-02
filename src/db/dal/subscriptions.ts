import { asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { activity, activityGroup, club, room, site } from "@/db/schema/club";
import {
  subscriptionModeEnum,
  subscriptionRestrictionEnum,
} from "@/db/schema/enums";
import { subscription } from "@/db/schema/subscription";
import { isCUID } from "@/lib/utils";
import {
  ActivityGroupId,
  ActivityId,
  ClubId,
  RoomId,
  SiteId,
  SubscriptionId,
} from "../types";

// ==================== SUBSCRIPTION QUERIES ====================

export async function getSubscriptionById(id: SubscriptionId) {
  return db.query.subscription.findFirst({
    where: eq(subscription.id, id),
    with: {
      users: true,
    },
  });
}

export async function getSubscriptionsForClub(clubId: ClubId) {
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
  clubId: ClubId;
  mode: (typeof subscriptionModeEnum.enumValues)[number];
  restriction: (typeof subscriptionRestrictionEnum.enumValues)[number];
}) {
  return db.insert(subscription).values(data).returning();
}

export async function updateSubscription(data: {
  id: SubscriptionId;
  name?: string;
  highlight?: string;
  description?: string;
  startDate?: Date;
  monthly?: number;
  yearly?: number;
  cancelationFee?: number;
  clubId?: ClubId;
  mode?: (typeof subscriptionModeEnum.enumValues)[number];
  restriction?: (typeof subscriptionRestrictionEnum.enumValues)[number];
}) {
  return db
    .update(subscription)
    .set(data)
    .where(eq(subscription.id, data.id))
    .returning();
}

export async function dalUpdateSubscriptionSelection(data: {
  subscriptionId: SubscriptionId;
  sites: SiteId[];
  rooms: RoomId[];
  activityGroups: ActivityGroupId[];
  activities: ActivityId[];
}) {
  if (!isCUID(data.subscriptionId)) return null;

  return db
    .update(subscription)
    .set({
      sites: [...data.sites],
      rooms: [...data.rooms],
      activityGroups: [...data.activityGroups],
      activities: [...data.activities],
    })
    .where(eq(subscription.id, data.subscriptionId))
    .returning();
}

export async function deleteSubscription(id: SubscriptionId) {
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
    return db.delete(subscription).where(eq(subscription.id, id)).returning();
  }
}

// ==================== DATA NAMES HELPER ====================

export async function getDataNames(
  siteIds: SiteId[],
  roomIds: RoomId[],
  activityGroupIds: ActivityGroupId[],
  activityIds: ActivityId[],
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

export async function getClubWithActivities(clubId: ClubId) {
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

export async function getSitesWithRoomActivities(siteIds: SiteId[]) {
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

export async function getRoomsWithActivities(roomIds: RoomId[]) {
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

export async function getActivitiesListForClub(clubId: ClubId) {
  return db.query.activity.findMany({
    where: eq(activity.clubId, clubId),
  });
}

export async function getSitesWithRoomActivitiesBasic(siteIds: SiteId[]) {
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

export async function getRoomsWithActivitiesBasic(roomIds: RoomId[]) {
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
