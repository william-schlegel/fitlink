import { and, asc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import {
  activity,
  activityGroup,
  club,
  roomActivities,
} from "@/db/schema/club";

import type {
  CreateActivityGroupInput,
  CreateActivityInput,
  UpdateActivityGroupInput,
  UpdateActivityInput,
} from "@/schemas/activities";
import { ActivityGroupId, ActivityId, ClubId, RoomId, UserId } from "../types";

// ==================== ACTIVITY ====================

export async function getActivityById(id: ActivityId) {
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

export async function getActivitiesForClub(clubId: ClubId) {
  return db.query.club.findFirst({
    where: eq(club.id, clubId),
    with: { activities: true },
  });
}

export async function getAllActivitiesForGroup(groupId: ActivityGroupId) {
  return db.query.activity.findMany({
    where: eq(activity.groupId, groupId),
    with: { club: { columns: { name: true } } },
  });
}

export async function getAllClubsForGroup(groupId: ActivityGroupId) {
  return db.query.activity.findMany({
    where: eq(activity.groupId, groupId),
    with: { club: { columns: { name: true, id: true } } },
  });
}

export async function createActivity(data: CreateActivityInput) {
  return db.insert(activity).values(data);
}

export async function updateActivity(data: UpdateActivityInput) {
  return db.update(activity).set(data).where(eq(activity.id, data.id));
}

export async function deleteActivity(activityId: ActivityId) {
  return db.delete(activity).where(eq(activity.id, activityId));
}

// ==================== ACTIVITY GROUP ====================

export async function getActivityGroupById(id: ActivityGroupId) {
  return db.query.activityGroup.findFirst({
    where: eq(activityGroup.id, id),
  });
}

export async function getActivityGroupsForUser(userId: UserId) {
  return db.query.activityGroup.findMany({
    where: or(
      eq(activityGroup.default, true),
      eq(activityGroup.coachUserId, userId),
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

export async function createActivityGroup(data: CreateActivityGroupInput) {
  return db
    .insert(activityGroup)
    .values({
      name: data.name,
      coachUserId: data.coachUserId,
      default: data.default,
    })
    .returning();
}

export async function updateActivityGroup(data: UpdateActivityGroupInput) {
  return db
    .update(activityGroup)
    .set({
      name: data.name,
      default: data.default,
    })
    .where(eq(activityGroup.id, data.id));
}

export async function deleteActivityGroup(groupId: ActivityGroupId) {
  return db.delete(activityGroup).where(eq(activityGroup.id, groupId));
}

// ==================== ROOM ACTIVITIES ====================

export async function affectActivityToRoom(
  roomId: RoomId,
  activityId: ActivityId,
) {
  return db.insert(roomActivities).values({
    roomId,
    activityId,
  });
}

export async function removeActivityFromRoom(
  roomId: RoomId,
  activityId: ActivityId,
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
