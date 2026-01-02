import { and, asc, eq, ilike, or } from "drizzle-orm";

import {
  activity,
  activityGroup,
  club,
  roomActivities,
} from "@/db/schema/club";
import { db } from "@/db";

// ==================== ACTIVITY ====================

export async function getActivityById(id: string) {
  return db.query.activity.findFirst({
    where: eq(activity.id, id),
  });
}

export async function getActivityByName(name: string) {
  return db.query.activity.findMany({
    where: ilike(activity.name, `%${name}%`),
    limit: 25,
    with: { group: true },
  });
}

export async function getActivitiesForClub(clubId: string) {
  return db.query.club.findFirst({
    where: eq(club.id, clubId),
    with: { activities: true },
  });
}

export async function getAllActivitiesForGroup(groupId: string) {
  return db.query.activity.findMany({
    where: eq(activity.groupId, groupId),
    with: { club: { columns: { name: true } } },
  });
}

export async function getAllClubsForGroup(groupId: string) {
  return db.query.activity.findMany({
    where: eq(activity.groupId, groupId),
    with: { club: { columns: { name: true, id: true } } },
  });
}

export async function createActivity(data: {
  name: string;
  noCalendar?: boolean;
  reservationDuration?: number;
  clubId: string;
  groupId: string;
}) {
  return db.insert(activity).values(data);
}

export async function updateActivity(
  data: Partial<{
    id: string;
    name: string;
    noCalendar: boolean;
    reservationDuration: number;
    clubId: string;
    groupId: string;
  }>,
) {
  return db
    .update(activity)
    .set(data)
    .where(eq(activity.id, data.id ?? ""));
}

export async function deleteActivity(activityId: string) {
  return db.delete(activity).where(eq(activity.id, activityId));
}

// ==================== ACTIVITY GROUP ====================

export async function getActivityGroupById(id: string) {
  return db.query.activityGroup.findFirst({
    where: eq(activityGroup.id, id),
  });
}

export async function getActivityGroupsForUser(userId: string) {
  return db.query.activityGroup.findMany({
    where: or(
      eq(activityGroup.default, true),
      eq(activityGroup.coachId, userId),
    ),
    with: { activities: true },
    orderBy: asc(activityGroup.name),
  });
}

export async function getAllActivityGroups() {
  return db.query.activityGroup.findMany({
    with: { coach: { with: { user: true } } },
    orderBy: asc(activityGroup.name),
  });
}

export async function createActivityGroup(data: {
  name: string;
  coachId?: string | null;
  default?: boolean;
}) {
  return db
    .insert(activityGroup)
    .values({
      name: data.name,
      coachId: data.coachId,
      default: data.default,
    })
    .returning();
}

export async function updateActivityGroup(data: {
  id: string;
  name: string;
  default?: boolean;
}) {
  return db
    .update(activityGroup)
    .set({
      name: data.name,
      default: data.default,
    })
    .where(eq(activityGroup.id, data.id));
}

export async function deleteActivityGroup(groupId: string) {
  return db.delete(activityGroup).where(eq(activityGroup.id, groupId));
}

// ==================== ROOM ACTIVITIES ====================

export async function affectActivityToRoom(roomId: string, activityId: string) {
  return db.insert(roomActivities).values({
    roomId,
    activityId,
  });
}

export async function removeActivityFromRoom(
  roomId: string,
  activityId: string,
) {
  return db
    .delete(roomActivities)
    .where(
      and(
        eq(roomActivities.roomId, roomId),
        eq(roomActivities.activityId, activityId),
      ),
    );
}

