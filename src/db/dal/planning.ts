import { endOfDay, startOfDay } from "date-fns";
import { and, asc, between, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { activity, room, site } from "@/db/schema/club";
import { dayNameEnum } from "@/db/schema/enums";
import { course, planning, reservation } from "@/db/schema/planning";
import { getDayName } from "@/lib/dates/days";
import { isCUID } from "@/lib/utils";
import {
  CreatePlanningInput,
  PlanningData,
  PlanningSearchReturnData,
  UpdatePlanningInput,
  UpdatePlanningItemInput,
} from "@/schemas";
import {
  ActivityGroupId,
  ActivityId,
  ClubId,
  CourseId,
  PlanningId,
  ReservationId,
  RoomId,
  SiteId,
  UserId,
} from "../types";
import { getActivitiesForClub } from "./activities";
import { getReservationsByUserIdForDate } from "./users";

// ==================== PLANNING QUERIES ====================

export async function getPlanningsForClub(clubId: ClubId) {
  if (!isCUID(clubId)) return [];
  return db.query.planning.findMany({
    where: eq(planning.clubId, clubId),
    orderBy: asc(planning.startDate),
    with: {
      club: {
        columns: { name: true },
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

export async function getPlanningById(
  planningId: PlanningId,
): Promise<PlanningSearchReturnData | null> {
  if (!isCUID(planningId)) return null;
  const plan = await db.query.planning.findFirst({
    where: eq(planning.id, planningId),
    with: {
      club: {
        columns: { name: true },
      },
      site: {
        columns: { name: true },
      },
      room: {
        columns: { name: true },
      },
    },
  });
  if (!plan) return null;
  const returnedData: PlanningSearchReturnData = {
    id: plan.id,
    name: plan.name,
    clubId: plan.clubId,
    clubName: plan.club?.name ?? "",
    siteId: plan.siteId,
    siteName: plan.site?.name ?? "",
    roomId: plan.roomId,
    roomName: plan.room?.name ?? "",
    startDate: plan.startDate,
    endDate: plan.endDate,
    planningItems: await fillPlanningItems(plan.planningItems),
  };

  return returnedData;
}

type PlanningFilters = {
  day?: (typeof dayNameEnum.enumValues)[number];
  coachUserIds?: UserId[];
  roomIds?: RoomId[];
  siteIds?: SiteId[];
  activityIds?: ActivityId[];
};

function getCourseStartDate(baseDate: Date, startTime: string) {
  const [hours, minutes] = startTime.split(":").map((value) => Number(value));
  const date = new Date(baseDate);
  date.setHours(
    Number.isNaN(hours) ? 0 : hours,
    Number.isNaN(minutes) ? 0 : minutes,
    0,
    0,
  );
  return date;
}

function getTimeString(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export async function fillPlanningItems(
  planningItems: PlanningData["planningItems"] | null,
  filter?: PlanningFilters,
) {
  const cache = new Map<string, { name: string }>();
  if (!planningItems) return [];
  const planningItemsData: PlanningSearchReturnData["planningItems"] = [];
  function planFilter(item: PlanningData["planningItems"][number]) {
    if (filter?.day && item.day !== filter.day) return false;
    if (
      filter?.coachUserIds &&
      item.coachUserId &&
      !filter.coachUserIds.includes(item.coachUserId)
    )
      return false;
    if (filter?.roomIds && item.roomId && !filter.roomIds.includes(item.roomId))
      return false;
    if (filter?.siteIds && item.siteId && !filter.siteIds.includes(item.siteId))
      return false;
    if (
      filter?.activityIds &&
      item.activityId &&
      !filter.activityIds.includes(item.activityId)
    )
      return false;
    return true;
  }
  await Promise.all(
    planningItems.filter(planFilter).map(async (item) => {
      let activityName = "";
      if (cache.has(item.activityId) && item.activityId) {
        activityName = cache.get(item.activityId)?.name ?? "";
      } else {
        const act = await db.query.activity.findFirst({
          where: eq(activity.id, item.activityId),
          columns: { name: true },
        });
        activityName = act?.name ?? "";
        cache.set(item.activityId, { name: activityName });
      }
      let coachName = "";
      if (item.coachUserId)
        if (cache.has(item.coachUserId)) {
          coachName = cache.get(item.coachUserId)?.name ?? "";
        } else {
          const coach = await db.query.user.findFirst({
            where: eq(user.id, item.coachUserId),
            columns: { name: true },
          });
          coachName = coach?.name ?? "";
          cache.set(item.coachUserId, { name: coachName });
        }
      let roomName = "";
      if (item.roomId)
        if (cache.has(item.roomId)) {
          roomName = cache.get(item.roomId)?.name ?? "";
        } else {
          const r = await db.query.room.findFirst({
            where: eq(room.id, item.roomId),
            columns: { name: true },
          });
          roomName = r?.name ?? "";
          cache.set(item.roomId, { name: roomName });
        }
      let siteName = "";
      if (item.siteId)
        if (cache.has(item.siteId)) {
          siteName = cache.get(item.siteId)?.name ?? "";
        } else {
          const s = await db.query.site.findFirst({
            where: eq(site.id, item.siteId),
            columns: { name: true },
          });
          siteName = s?.name ?? "";
          cache.set(item.siteId, { name: siteName });
        }
      planningItemsData.push({
        slotId: item.slotId,
        activityId: item.activityId,
        activityName,
        day: item.day,
        dayName: item.day,
        startTime: item.startTime,
        duration: item.duration,
        coachUserId: item.coachUserId,
        coachName,
        roomId: item.roomId,
        roomName,
        siteId: item.siteId,
        siteName,
        deleted: item.deleted,
        noCalendar: item.noCalendar,
      });
    }),
  );
  return planningItemsData;
}

export async function getClubDailyPlanning(
  clubId: ClubId,
  day: (typeof dayNameEnum.enumValues)[number],
) {
  if (!isCUID(clubId)) return null;
  const plan = await db.query.planning.findFirst({
    where: and(
      eq(planning.clubId, clubId),
      lte(planning.startDate, new Date(Date.now())),
    ),
    with: {
      club: true,
      site: true,
      room: true,
    },
  });
  if (!plan) return null;
  return {
    ...plan,
    clubName: plan.club?.name ?? "",
    planningItems: await fillPlanningItems(plan.planningItems, { day }),
  };
}

export async function getCoachDailyPlanning(
  coachUserId: UserId,
  day: (typeof dayNameEnum.enumValues)[number],
) {
  if (!isCUID(coachUserId)) return [];
  const plan = await db.query.planning.findMany({
    where: and(lte(planning.startDate, new Date(Date.now()))),
    with: {
      club: true,
      site: true,
      room: true,
    },
  });
  if (!plan) return null;
  const plannings: PlanningSearchReturnData[] = [];
  await Promise.all(
    plan.map(async (p) => {
      const planningItems = await fillPlanningItems(p.planningItems, {
        day,
        coachUserIds: [coachUserId],
      });
      plannings.push({
        ...p,
        clubName: p.club?.name ?? "",
        siteName: p.site?.name ?? "",
        roomName: p.room?.name ?? "",
        planningItems,
      });
    }),
  );
  return plannings;
}

export async function getCoachPlanningForClub(
  coachUserId: UserId,
  clubId: ClubId,
) {
  const plan = await db.query.planning.findFirst({
    where: and(
      eq(planning.clubId, clubId),
      lte(planning.startDate, new Date(Date.now())),
    ),
    with: {
      club: true,
    },
  });
  if (!plan) return null;
  return {
    ...plan,
    planningItems: await fillPlanningItems(plan.planningItems, {
      coachUserIds: [coachUserId],
    }),
  };
}

export async function getMemberDataWithSubscriptions(memberId: UserId) {
  return db.query.user.findFirst({
    where: eq(user.id, memberId),
    with: {
      memberData: {
        with: {
          subscriptions: {
            with: {
              subscription: true,
            },
          },
        },
      },
    },
  });
}

export type ReservationData = {
  id: ReservationId;
  slotNumber: number | null;
  planningId: PlanningId | null;
  slotId: string | null;
};

export async function getMemberDailyPlanning(memberId: UserId, date: Date) {
  const userData = await getMemberDataWithSubscriptions(memberId);
  const clubIds = Array.from(
    new Set(
      userData?.memberData?.subscriptions.map((s) => s.subscription.clubId),
    ),
  );
  const planningClubs = await getPlanningsForClubIds(clubIds);
  const planningIds = planningClubs.map((plan) => plan.id);
  const coursesForDay =
    planningIds.length > 0
      ? await db.query.course.findMany({
          where: and(
            inArray(course.planningId, planningIds),
            between(course.date, startOfDay(date), endOfDay(date)),
          ),
        })
      : [];
  const coursesByPlanningId = new Map<
    PlanningId,
    Map<string, typeof course.$inferSelect>
  >();
  for (const courseItem of coursesForDay) {
    const mapForPlanning =
      coursesByPlanningId.get(courseItem.planningId) ?? new Map();
    mapForPlanning.set(courseItem.slotId, courseItem);
    coursesByPlanningId.set(courseItem.planningId, mapForPlanning);
  }
  const dayName = getDayName(date);
  const planningData: PlanningSearchReturnData[] = [];

  for (const planningClub of planningClubs) {
    const sub = userData?.memberData?.subscriptions
      .flatMap((s) => s.subscription)
      .filter((s) => s.clubId === planningClub.clubId);

    const activityIds = new Set<ActivityId>();

    for (const s of sub ?? []) {
      if (s.mode === "ALL_INCLUSIVE") {
        const clubActivities = await getActivitiesForClub(planningClub.clubId);
        for (const a of clubActivities?.activities ?? []) {
          activityIds.add(a.id);
        }
      }
      if (s.mode === "DAY" && s.day === dayName) {
        const clubActivities = await getActivitiesForClub(planningClub.clubId);
        for (const a of clubActivities?.activities ?? []) {
          activityIds.add(a.id);
        }
      }
      if (s.mode === "COURSE") {
        // TODO: manage subscriptions per sourse
      }
      if (s.mode === "ACTIVITY_GROUP" && s.activityGroups.length > 0) {
        const activityGroupIds = s.activityGroups;
        const activitiesFromGroups =
          await getActivitiesForGroups(activityGroupIds);
        for (const a of activitiesFromGroups) {
          activityIds.add(a.id);
        }
      }

      if (s.mode === "ACTIVITY" && s.activities.length > 0) {
        for (const a of s.activities) {
          activityIds.add(a);
        }
      }
    }

    const courseOverrides = coursesByPlanningId.get(planningClub.id);
    const itemsWithOverrides = (planningClub.planningItems ?? []).map(
      (item) => {
        const courseOverride = courseOverrides?.get(item.slotId);
        if (!courseOverride) return item;
        return {
          ...item,
          activityId: courseOverride.activityId,
          coachUserId: courseOverride.coachUserId,
          roomId: courseOverride.roomId,
          siteId: courseOverride.siteId,
          startTime: getTimeString(courseOverride.date),
        };
      },
    );

    const planItems = await fillPlanningItems(itemsWithOverrides, {
      day: dayName,
      activityIds: Array.from(activityIds),
    });

    planningData.push({
      clubId: planningClub.clubId,
      clubName: planningClub.club.name,
      siteId: planningClub.siteId,
      siteName: planningClub.site?.name ?? "",
      roomId: planningClub.roomId,
      roomName: planningClub.room?.name ?? "",
      id: planningClub.id,
      name: planningClub.name,
      startDate: planningClub.startDate,
      endDate: planningClub.endDate,
      planningItems: planItems,
    });

    // const pa = await getPlanningActivitiesWithFilters(
    //   planningClub.id,
    //   dayName,
    //   input.date,
    // );

    // const withNoCalendar = await getActivitiesWithNoCalendar(
    //   planningClub.clubId,
    //   input.date,
    // );
  }
  const userReservations = await getReservationsByUserIdForDate(memberId, date);
  //   planningData.push({
  //     ...planningClub,
  //     activities: pa.map((p) => {
  //       const allReservations = p.reservations.filter(
  //         (r) => r.planningActivityId === p.id,
  //       );
  //       return {
  //         ...p,
  //         reservations: allReservations.map((r) => ({
  //           id:
  //             r.userId === input.memberId
  //               ? (r.planningActivityId ?? p.id)
  //               : r.id,
  //           date: r.date,
  //         })),
  //       };
  //     }),
  //     withNoCalendar: withNoCalendar.map((wnc) => {
  //       const allReservations = (wnc.reservations ?? []).filter(
  //         (r) => r.activityId === wnc.id,
  //       );
  //       return {
  //         id: wnc.id,
  //         name: wnc.name,
  //         clubId: wnc.clubId,
  //         reservationDuration: wnc.reservationDuration,
  //         rooms: (wnc.rooms ?? []).map((ra) => ({
  //           id: ra.room.id,
  //           name: ra.room.name,
  //           capacity: ra.room.capacity,
  //           reservation: ra.room.reservation ?? "NONE",
  //         })),
  //         reservations: allReservations.map((r) => ({
  //           id:
  //             r.userId === input.memberId ? (r.activityId ?? wnc.id) : r.id,
  //           date: r.date,
  //           roomName: r.room?.name ?? "",
  //         })),
  //       };
  //     }),
  //   });
  // }

  const reservationData: ReservationData[] = userReservations.map((r) => ({
    id: r.id,
    slotNumber: r.slotNumber,
    planningId: r.planningId,
    slotId: r.slotId,
  }));

  return {
    planning: planningData,
    reservations: reservationData,
  };
}

export async function getPlanningsForClubIds(clubIds: ClubId[]) {
  return db.query.planning.findMany({
    where: and(
      lte(planning.startDate, new Date(Date.now())),
      inArray(planning.clubId, clubIds),
    ),
    with: { club: true, site: true, room: true },
  });
}

export async function getActivitiesForGroups(groupIds: ActivityGroupId[]) {
  return db.query.activity.findMany({
    where: inArray(activity.groupId, groupIds),
    columns: { id: true },
  });
}

export async function getPlanningActivitiesWithFilters(
  planningId: PlanningId,
  date?: Date,
  filters?: PlanningFilters,
) {
  const plan = await db.query.planning.findFirst({
    where: and(
      eq(planning.id, planningId),
      lte(planning.startDate, new Date(date ?? Date.now())),
    ),
    with: { club: true },
  });
  if (!plan) return null;
  return {
    ...plan,
    planningItems: await fillPlanningItems(plan.planningItems, filters),
  };
}

export async function getActivitiesWithNoCalendar(
  clubId: ClubId,
  date?: Date,
  filters?: PlanningFilters,
) {
  const baseConditions = [
    eq(activity.clubId, clubId),
    eq(activity.noCalendar, true),
  ];

  const acts = await db.query.activity.findMany({
    where: and(...baseConditions),
    with: {
      group: true,
      club: true,
    },
  });
}

// ==================== PLANNING MUTATIONS ====================

export async function createPlanning(data: CreatePlanningInput) {
  return db.insert(planning).values(data).returning();
}

export async function updatePlanning(data: UpdatePlanningInput) {
  if (!data.id) return null;
  return db
    .update(planning)
    .set(data)
    .where(eq(planning.id, data.id))
    .returning();
}

export async function duplicatePlanning(
  originalId: PlanningId,
  newData: { name?: string; startDate?: Date; endDate?: Date },
) {
  const org = await db.query.planning.findFirst({
    where: eq(planning.id, originalId),
  });

  if (!org) return null;

  const newPlanning = await db
    .insert(planning)
    .values({
      clubId: org.clubId,
      name: newData.name ?? org.name,
      startDate: newData.startDate,
      endDate: newData.endDate,
      planningItems: org.planningItems?.map((item) => ({
        ...item,
        slotId: crypto.randomUUID(),
      })),
    })
    .returning();

  return newPlanning[0];
}

export async function deletePlanning(planningId: PlanningId) {
  return db.delete(planning).where(eq(planning.id, planningId));
}

// ==================== PLANNING ACTIVITY ====================

export async function getPlanningActivityById(
  planningId: PlanningId,
  slotId: string,
) {
  if (!planningId || !slotId) return null;
  const plan = await db.query.planning.findFirst({
    where: eq(planning.id, planningId),
  });
  if (!plan) return null;
  const item = plan.planningItems?.find((item) => item.slotId === slotId);
  if (!item) return null;
  const completedItem = await fillPlanningItems([item]);
  return completedItem[0];
}

// ==================== COURSES ====================

export async function getCourseForSlotDate(data: {
  planningId: PlanningId;
  slotId: string;
  date: Date;
}) {
  const found = await db.query.course.findFirst({
    where: and(
      eq(course.planningId, data.planningId),
      eq(course.slotId, data.slotId),
      between(course.date, startOfDay(data.date), endOfDay(data.date)),
    ),
  });
  return found ?? null;
}

export async function upsertCourseForSlotDate(data: {
  courseId?: CourseId;
  planningId: PlanningId;
  slotId: string;
  date: Date;
  activityId: ActivityId;
  siteId: SiteId | null;
  roomId: RoomId | null;
  coachUserId: UserId | null;
  slotNumber?: number;
  cancelled?: boolean;
  message?: string | null;
}) {
  return db.transaction(async (tx) => {
    const existingById = data.courseId
      ? await tx.query.course.findFirst({
          where: and(
            eq(course.id, data.courseId),
            eq(course.planningId, data.planningId),
          ),
        })
      : null;
    const existingBySlotDate = existingById
      ? null
      : await tx.query.course.findFirst({
          where: and(
            eq(course.planningId, data.planningId),
            eq(course.slotId, data.slotId),
            between(course.date, startOfDay(data.date), endOfDay(data.date)),
          ),
        });
    const existing = existingById ?? existingBySlotDate;
    const activityData = await tx.query.activity.findFirst({
      where: eq(activity.id, data.activityId),
      columns: { name: true },
    });
    const roomData = data.roomId
      ? await tx.query.room.findFirst({
          where: eq(room.id, data.roomId),
          columns: { capacity: true },
        })
      : null;
    const nextName = activityData?.name ?? "Course";
    const nextCapacity = roomData?.capacity ?? existing?.capacity ?? 0;

    if (existing) {
      const updated = await tx
        .update(course)
        .set({
          activityId: data.activityId,
          siteId: data.siteId,
          roomId: data.roomId,
          coachUserId: data.coachUserId,
          date: data.date,
          name: nextName,
          capacity: nextCapacity,
          cancelled: data.cancelled ?? existing.cancelled,
          message: data.message ?? existing.message,
        })
        .where(eq(course.id, existing.id))
        .returning();
      return updated[0];
    }

    const reservationsForDay = await tx.query.reservation.findMany({
      where: and(
        eq(reservation.planningId, data.planningId),
        eq(reservation.slotId, data.slotId),
        between(reservation.date, startOfDay(data.date), endOfDay(data.date)),
      ),
      columns: { id: true },
    });

    const created = await tx
      .insert(course)
      .values({
        name: nextName,
        date: data.date,
        planningId: data.planningId,
        slotId: data.slotId,
        slotNumber: data.slotNumber ?? 0,
        activityId: data.activityId,
        siteId: data.siteId,
        roomId: data.roomId,
        coachUserId: data.coachUserId,
        cancelled: data.cancelled ?? false,
        message: data.message ?? null,
        capacity: nextCapacity,
        reservations: reservationsForDay.map((r) => r.id),
      })
      .returning();

    return created[0];
  });
}

export async function addPlanningActivity(data: {
  planningId: PlanningId;
  item: Omit<PlanningData["planningItems"][number], "slotId">;
}) {
  const plan = await db.query.planning.findFirst({
    where: eq(planning.id, data.planningId),
  });
  if (!plan) return null;
  const newItem = {
    ...data.item,
    slotId: crypto.randomUUID(),
  };
  plan.planningItems?.push(newItem);
  return db
    .update(planning)
    .set({ planningItems: plan.planningItems })
    .where(eq(planning.id, data.planningId))
    .returning();
}

export async function updatePlanningActivity(
  planningId: PlanningId,
  item: UpdatePlanningItemInput,
) {
  const plan = await db.query.planning.findFirst({
    where: eq(planning.id, planningId),
  });
  if (!plan) return null;
  const itemIndex = plan.planningItems?.findIndex(
    (i) => i.slotId === item.slotId,
  );
  if (itemIndex === undefined || itemIndex < 0) return null;
  const newItems = [...(plan.planningItems ?? [])];
  newItems[itemIndex] = {
    ...newItems[itemIndex],
    ...item,
  };
  return db
    .update(planning)
    .set({ planningItems: newItems })
    .where(eq(planning.id, planningId))
    .returning();
}

export async function deletePlanningActivity(
  planningId: PlanningId,
  slotId: string,
) {
  const plan = await db.query.planning.findFirst({
    where: eq(planning.id, planningId),
  });
  if (!plan) return null;
  const itemToDelete = plan.planningItems?.find(
    (item) => item.slotId === slotId,
  );
  if (!itemToDelete) return plan;
  itemToDelete.deleted = true;

  return db
    .update(planning)
    .set({ planningItems: plan.planningItems })
    .where(eq(planning.id, planningId))
    .returning();
}

// ==================== RESERVATIONS ====================

export async function createPlanningReservation(data: {
  date: Date;
  planningId: PlanningId;
  slotId: string;
  userId: UserId;
}) {
  return db.transaction(async (tx) => {
    const created = await tx
      .insert(reservation)
      .values({
        date: data.date,
        planningId: data.planningId,
        slotId: data.slotId,
        userId: data.userId,
        reservationDate: new Date(),
      })
      .returning();
    const newReservation = created[0];
    if (!newReservation) return created;

    const plan = await tx.query.planning.findFirst({
      where: eq(planning.id, data.planningId),
    });
    const planItem = plan?.planningItems?.find(
      (item) => item.slotId === data.slotId,
    );
    if (!planItem) return created;

    const courseDate = getCourseStartDate(data.date, planItem.startTime);
    const existingCourse = await tx.query.course.findFirst({
      where: and(
        eq(course.planningId, data.planningId),
        eq(course.slotId, data.slotId),
        between(course.date, startOfDay(courseDate), endOfDay(courseDate)),
      ),
    });
    const nextReservations = Array.from(
      new Set([...(existingCourse?.reservations ?? []), newReservation.id]),
    );

    if (existingCourse) {
      await tx
        .update(course)
        .set({ reservations: nextReservations })
        .where(eq(course.id, existingCourse.id));
      return created;
    }

    if (!planItem.siteId || !planItem.roomId || !planItem.coachUserId)
      return created;

    const activityData = await tx.query.activity.findFirst({
      where: eq(activity.id, planItem.activityId),
      columns: { name: true },
    });
    const roomData = planItem.roomId
      ? await tx.query.room.findFirst({
          where: eq(room.id, planItem.roomId),
          columns: { capacity: true },
        })
      : null;

    await tx.insert(course).values({
      name: activityData?.name ?? "Course",
      date: courseDate,
      planningId: data.planningId,
      slotId: data.slotId,
      slotNumber: 0,
      activityId: planItem.activityId,
      siteId: planItem.siteId ?? null,
      roomId: planItem.roomId ?? null,
      coachUserId: planItem.coachUserId ?? null,
      cancelled: false,
      message: null,
      capacity: roomData?.capacity ?? 0,
      reservations: nextReservations,
    });

    return created;
  });
}

export async function createActivityReservation(data: {
  date: Date;
  planningId: PlanningId;
  slotId: string;
  userId: UserId;
  slotNumber: number;
}) {
  return db
    .insert(reservation)
    .values({
      date: data.date,
      planningId: data.planningId,
      slotId: data.slotId,
      userId: data.userId,
      reservationDate: new Date(),
      slotNumber: data.slotNumber,
    })
    .returning();
}

export async function deleteReservation(id: ReservationId) {
  return db.transaction(async (tx) => {
    const existingReservation = await tx.query.reservation.findFirst({
      where: eq(reservation.id, id),
    });
    if (!existingReservation)
      return tx.delete(reservation).where(eq(reservation.id, id)).returning();

    const deleted = await tx
      .delete(reservation)
      .where(eq(reservation.id, id))
      .returning();

    if (!existingReservation.planningId || !existingReservation.slotId)
      return deleted;

    const existingCourse = await tx.query.course.findFirst({
      where: and(
        eq(course.planningId, existingReservation.planningId),
        eq(course.slotId, existingReservation.slotId),
        between(
          course.date,
          startOfDay(existingReservation.date),
          endOfDay(existingReservation.date),
        ),
      ),
    });
    if (!existingCourse) return deleted;

    const nextReservations = (existingCourse.reservations ?? []).filter(
      (reservationId) => reservationId !== id,
    );
    await tx
      .update(course)
      .set({ reservations: nextReservations })
      .where(eq(course.id, existingCourse.id));

    return deleted;
  });
}
