import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";

import { endOfDay, startOfDay } from "date-fns";

import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { activity } from "@/db/schema/club";
import { dayNameEnum } from "@/db/schema/enums";
import { planning, planningActivity, reservation } from "@/db/schema/planning";
import { isCUID } from "@/lib/utils";

// ==================== PLANNING QUERIES ====================

export async function getPlanningsForClub(clubId: string) {
  if (!isCUID(clubId)) return [];
  return db.query.planning.findMany({
    where: eq(planning.clubId, clubId),
    orderBy: asc(planning.startDate),
  });
}

export async function getPlanningById(planningId: string) {
  if (!isCUID(planningId)) return null;
  return db.query.planning.findFirst({
    where: eq(planning.id, planningId),
    with: {
      planningActivities: {
        with: {
          activity: true,
          site: true,
          room: true,
          coach: true,
        },
      },
      site: {
        columns: { name: true },
      },
      room: {
        columns: { name: true },
      },
    },
  });
}

export async function getClubDailyPlanning(
  clubId: string,
  day: (typeof dayNameEnum.enumValues)[number],
) {
  if (!isCUID(clubId)) return null;
  return db.query.planning.findFirst({
    where: and(
      eq(planning.clubId, clubId),
      lte(planning.startDate, new Date(Date.now())),
    ),
    with: {
      club: true,
      planningActivities: {
        where: eq(planningActivity.day, day),
        with: {
          activity: true,
          coach: { with: { user: true } },
          room: true,
          site: true,
        },
      },
    },
  });
}

export async function getCoachDailyPlanning(
  coachId: string,
  day: (typeof dayNameEnum.enumValues)[number],
) {
  if (!isCUID(coachId)) return [];
  return db.query.planning.findMany({
    where: and(
      eq(planning.clubId, coachId),
      lte(planning.startDate, new Date(Date.now())),
      eq(planningActivity.coachId, coachId),
    ),
    with: {
      club: true,
      planningActivities: {
        where: and(
          eq(planningActivity.day, day),
          eq(planningActivity.coachId, coachId),
        ),
        with: {
          activity: true,
          coach: true,
          room: true,
          site: true,
        },
      },
    },
  });
}

export async function getCoachPlanningForClub(coachId: string, clubId: string) {
  return db.query.planning.findFirst({
    where: and(
      eq(planning.clubId, clubId),
      lte(planning.startDate, new Date(Date.now())),
    ),
    with: {
      club: true,
      planningActivities: {
        where: eq(planningActivity.coachId, coachId),
        with: {
          activity: true,
          coach: true,
          room: true,
          site: true,
        },
      },
    },
  });
}

export async function getMemberDataWithSubscriptions(memberId: string) {
  return db.query.user.findFirst({
    where: eq(user.id, memberId),
    with: {
      memberData: {
        with: {
          subscriptions: {
            with: {
              subscription: {
                with: {
                  activitieGroups: true,
                  activities: true,
                  rooms: true,
                  sites: true,
                  club: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getPlanningsForClubIds(clubIds: string[]) {
  return db.query.planning.findMany({
    where: and(
      lte(planning.startDate, new Date(Date.now())),
      inArray(planning.clubId, clubIds),
    ),
    with: { club: true },
  });
}

export async function getActivitiesForGroups(groupIds: string[]) {
  return db.query.activity.findMany({
    where: inArray(activity.groupId, groupIds),
    columns: { id: true },
  });
}

export async function getPlanningActivitiesWithFilters(
  planningId: string,
  day: (typeof dayNameEnum.enumValues)[number],
  date: Date,
  additionalConditions?: ReturnType<typeof and>,
) {
  const baseConditions = [
    eq(planningActivity.day, day),
    eq(planningActivity.planningId, planningId),
  ];

  if (additionalConditions) {
    baseConditions.push(additionalConditions);
  }

  return db.query.planningActivity.findMany({
    where: and(...baseConditions),
    with: {
      activity: true,
      coach: true,
      room: true,
      site: true,
      reservations: {
        where: and(
          gte(reservation.date, startOfDay(new Date(date))),
          lte(reservation.date, endOfDay(new Date(date))),
        ),
      },
    },
  });
}

export async function getActivitiesWithNoCalendar(
  clubId: string,
  date: Date,
  additionalConditions?: ReturnType<typeof and>,
) {
  const baseConditions = [
    eq(activity.clubId, clubId),
    eq(activity.noCalendar, true),
  ];

  if (additionalConditions) {
    baseConditions.push(additionalConditions);
  }

  return db.query.activity.findMany({
    where: and(...baseConditions),
    with: {
      rooms: {
        with: {
          room: {
            columns: {
              id: true,
              name: true,
              capacity: true,
              reservation: true,
            },
          },
        },
      },
      reservations: {
        where: and(
          gte(reservation.date, startOfDay(new Date(date))),
          lte(reservation.date, endOfDay(new Date(date))),
        ),
        with: {
          room: true,
        },
      },
    },
  });
}

// ==================== PLANNING MUTATIONS ====================

export async function createPlanning(data: {
  clubId: string;
  startDate?: Date;
  siteId?: string;
  roomId?: string;
  endDate?: Date;
  name?: string;
}) {
  return db.insert(planning).values(data).returning();
}

export async function updatePlanning(data: {
  id: string;
  clubId?: string;
  startDate?: Date;
  siteId?: string;
  roomId?: string;
  endDate?: Date;
  name?: string;
}) {
  return db
    .update(planning)
    .set(data)
    .where(eq(planning.id, data.id))
    .returning();
}

export async function duplicatePlanning(
  originalId: string,
  newData: { name?: string; startDate?: Date; endDate?: Date },
) {
  const org = await db.query.planning.findFirst({
    where: eq(planning.id, originalId),
    with: { planningActivities: true },
  });

  if (!org) return null;

  return db.transaction(async (tx) => {
    const newPlanning = await tx
      .insert(planning)
      .values({
        clubId: org.clubId,
        name: newData.name ?? org.name,
        startDate: newData.startDate,
        endDate: newData.endDate,
        siteId: org.siteId,
        roomId: org.roomId,
      })
      .returning();

    await tx.insert(planningActivity).values(
      org.planningActivities.map((pa) => ({
        planningId: newPlanning[0].id,
        day: pa.day,
        startTime: pa.startTime,
        duration: pa.duration,
        activityId: pa.activityId,
        coachId: pa.coachId,
        siteId: pa.siteId,
        roomId: pa.roomId,
      })),
    );

    return newPlanning[0];
  });
}

export async function deletePlanning(planningId: string) {
  return db.delete(planning).where(eq(planning.id, planningId));
}

// ==================== PLANNING ACTIVITY ====================

export async function getPlanningActivityById(id: string) {
  if (!id) return null;
  return db.query.planningActivity.findFirst({
    where: eq(planningActivity.id, id),
    with: {
      activity: true,
      site: {
        with: { rooms: true },
      },
      room: true,
      coach: true,
    },
  });
}

export async function addPlanningActivity(data: {
  planningId: string;
  activityId: string;
  siteId: string;
  roomId?: string;
  day: (typeof dayNameEnum.enumValues)[number];
  startTime: string;
  duration: number;
  coachId?: string;
}) {
  return db.insert(planningActivity).values(data).returning();
}

export async function updatePlanningActivity(data: {
  id: string;
  planningId?: string;
  activityId?: string;
  siteId?: string;
  roomId?: string;
  day?: (typeof dayNameEnum.enumValues)[number];
  startTime?: string;
  duration?: number;
  coachId?: string;
}) {
  return db
    .update(planningActivity)
    .set(data)
    .where(eq(planningActivity.id, data.id))
    .returning();
}

export async function deletePlanningActivity(id: string) {
  return db
    .delete(planningActivity)
    .where(eq(planningActivity.id, id))
    .returning();
}

// ==================== RESERVATIONS ====================

export async function createPlanningReservation(data: {
  date: Date;
  planningActivityId: string;
  userId: string;
}) {
  return db
    .insert(reservation)
    .values({
      date: data.date,
      planningActivityId: data.planningActivityId,
      userId: data.userId,
    })
    .returning();
}

export async function createActivityReservation(data: {
  date: Date;
  activityId: string;
  userId: string;
  activitySlot: number;
  roomId: string;
}) {
  return db
    .insert(reservation)
    .values({
      date: data.date,
      activityId: data.activityId,
      userId: data.userId,
      activitySlot: data.activitySlot,
      roomId: data.roomId,
    })
    .returning();
}

export async function deleteReservation(id: string) {
  return db.delete(reservation).where(eq(reservation.id, id));
}
