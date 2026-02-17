import { endOfDay, startOfDay } from "date-fns";
import { and, asc, between, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { activity, room, site } from "@/db/schema/club";
import { dayNameEnum } from "@/db/schema/enums";
import { course, planning, planningItem, reservation } from "@/db/schema/planning";
import { getDayName } from "@/lib/dates/days";
import { isCUID } from "@/lib/utils";
import {
  CreatePlanningInput,
  PlanningItemData,
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
  PlanningItemId,
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
  const planningItems = await getPlanningItemsWithRelations([plan.id]);
  const itemsByPlanningId = groupPlanningItemsByPlanningId(planningItems);
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
    planningItems: await fillPlanningItems(itemsByPlanningId.get(plan.id) ?? []),
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

type PlanningItemWithRelations = typeof planningItem.$inferSelect & {
  activity: { name: string } | null;
  coach: { name: string } | null;
  room: { name: string } | null;
  site: { name: string } | null;
  club: { name: string } | null;
};

async function getPlanningItemsWithRelations(
  planningIds: PlanningId[],
  filter?: PlanningFilters,
) {
  if (planningIds.length === 0) return [];
  const conditions = [inArray(planningItem.planningId, planningIds)];
  if (filter?.day) conditions.push(eq(planningItem.day, filter.day));
  if (filter?.coachUserIds?.length)
    conditions.push(inArray(planningItem.coachUserId, filter.coachUserIds));
  if (filter?.roomIds?.length)
    conditions.push(inArray(planningItem.roomId, filter.roomIds));
  if (filter?.siteIds?.length)
    conditions.push(inArray(planningItem.siteId, filter.siteIds));
  if (filter?.activityIds?.length)
    conditions.push(inArray(planningItem.activityId, filter.activityIds));

  return db.query.planningItem.findMany({
    where: and(...conditions),
    with: {
      activity: { columns: { name: true } },
      coach: { columns: { name: true } },
      room: { columns: { name: true } },
      site: { columns: { name: true } },
      club: { columns: { name: true } },
    },
  });
}

function groupPlanningItemsByPlanningId(items: PlanningItemWithRelations[]) {
  const grouped = new Map<PlanningId, PlanningItemWithRelations[]>();
  for (const item of items) {
    const bucket = grouped.get(item.planningId) ?? [];
    bucket.push(item);
    grouped.set(item.planningId, bucket);
  }
  return grouped;
}

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
  planningItems: PlanningItemWithRelations[],
) {
  if (planningItems.length === 0) return [];
  return planningItems.map((item) => ({
    id: item.id,
    activityId: item.activityId,
    activityName: item.activity?.name ?? "",
    day: item.day,
    dayName: item.day,
    startTime: item.startTime,
    duration: item.duration,
    coachUserId: item.coachUserId,
    coachName: item.coach?.name ?? "",
    roomId: item.roomId,
    roomName: item.room?.name ?? "",
    siteId: item.siteId,
    siteName: item.site?.name ?? "",
    deleted: item.deleted,
    noCalendar: item.noCalendar,
  }));
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
  const planningItems = await getPlanningItemsWithRelations([plan.id], { day });
  return {
    ...plan,
    clubName: plan.club?.name ?? "",
    planningItems: await fillPlanningItems(planningItems),
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
  const planningIds = plan.map((p) => p.id);
  const planningItems = await getPlanningItemsWithRelations(planningIds, {
    day,
    coachUserIds: [coachUserId],
  });
  const itemsByPlanningId = groupPlanningItemsByPlanningId(planningItems);
  const plannings: PlanningSearchReturnData[] = [];
  for (const p of plan) {
    plannings.push({
      ...p,
      clubName: p.club?.name ?? "",
      siteName: p.site?.name ?? "",
      roomName: p.room?.name ?? "",
      planningItems: await fillPlanningItems(
        itemsByPlanningId.get(p.id) ?? [],
      ),
    });
  }
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
  const planningItems = await getPlanningItemsWithRelations([plan.id], {
    coachUserIds: [coachUserId],
  });
  return {
    ...plan,
    planningItems: await fillPlanningItems(planningItems),
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
  planningItemId: PlanningItemId | null;
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
    Map<PlanningItemId, typeof course.$inferSelect>
  >();
  for (const courseItem of coursesForDay) {
    const mapForPlanning =
      coursesByPlanningId.get(courseItem.planningId) ?? new Map();
    mapForPlanning.set(courseItem.planningItemId, courseItem);
    coursesByPlanningId.set(courseItem.planningId, mapForPlanning);
  }
  const dayName = getDayName(date);
  const planningItems = await getPlanningItemsWithRelations(planningIds, {
    day: dayName,
  });
  const itemsByPlanningId = groupPlanningItemsByPlanningId(planningItems);

  const overrideActivityIds = new Set<ActivityId>();
  const overrideSiteIds = new Set<SiteId>();
  const overrideRoomIds = new Set<RoomId>();
  const overrideCoachIds = new Set<UserId>();
  for (const courseItem of coursesForDay) {
    overrideActivityIds.add(courseItem.activityId);
    if (courseItem.siteId) overrideSiteIds.add(courseItem.siteId);
    if (courseItem.roomId) overrideRoomIds.add(courseItem.roomId);
    if (courseItem.coachUserId) overrideCoachIds.add(courseItem.coachUserId);
  }

  const [overrideActivities, overrideSites, overrideRooms, overrideCoaches] =
    await Promise.all([
      overrideActivityIds.size > 0
        ? db.query.activity.findMany({
            where: inArray(activity.id, Array.from(overrideActivityIds)),
            columns: { id: true, name: true },
          })
        : [],
      overrideSiteIds.size > 0
        ? db.query.site.findMany({
            where: inArray(site.id, Array.from(overrideSiteIds)),
            columns: { id: true, name: true },
          })
        : [],
      overrideRoomIds.size > 0
        ? db.query.room.findMany({
            where: inArray(room.id, Array.from(overrideRoomIds)),
            columns: { id: true, name: true },
          })
        : [],
      overrideCoachIds.size > 0
        ? db.query.user.findMany({
            where: inArray(user.id, Array.from(overrideCoachIds)),
            columns: { id: true, name: true },
          })
        : [],
    ]);

  const overrideActivityNames = new Map(
    overrideActivities.map((item) => [item.id, item.name]),
  );
  const overrideSiteNames = new Map(
    overrideSites.map((item) => [item.id, item.name]),
  );
  const overrideRoomNames = new Map(
    overrideRooms.map((item) => [item.id, item.name]),
  );
  const overrideCoachNames = new Map(
    overrideCoaches.map((item) => [item.id, item.name]),
  );
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
    const baseItems = await fillPlanningItems(
      itemsByPlanningId.get(planningClub.id) ?? [],
    );
    const itemsWithOverrides = baseItems.map((item) => {
      const courseOverride = courseOverrides?.get(item.id);
      if (!courseOverride) return item;
      const nextActivityId = courseOverride.activityId;
      const nextCoachId = courseOverride.coachUserId ?? null;
      const nextRoomId = courseOverride.roomId ?? null;
      const nextSiteId = courseOverride.siteId ?? null;
      return {
        ...item,
        activityId: nextActivityId,
        activityName:
          overrideActivityNames.get(nextActivityId) ?? item.activityName,
        coachUserId: nextCoachId,
        coachName: nextCoachId
          ? overrideCoachNames.get(nextCoachId) ?? ""
          : "",
        roomId: nextRoomId,
        roomName: nextRoomId ? overrideRoomNames.get(nextRoomId) ?? "" : "",
        siteId: nextSiteId,
        siteName: nextSiteId ? overrideSiteNames.get(nextSiteId) ?? "" : "",
        startTime: getTimeString(courseOverride.date),
      };
    });

    const planItems =
      activityIds.size === 0
        ? []
        : itemsWithOverrides.filter((item) => activityIds.has(item.activityId));

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
    planningItemId: r.planningItemId,
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
  const planningItems = await getPlanningItemsWithRelations([plan.id], filters);
  return {
    ...plan,
    planningItems: await fillPlanningItems(planningItems),
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
  const { planningItems, ...planningData } = data;
  const created = await db.insert(planning).values(planningData).returning();
  const createdPlanning = created[0];
  if (!createdPlanning) return created;
  if (planningItems?.length) {
    const itemsToInsert = planningItems.map((item) => {
      const { id, ...rest } = item;
      return {
        id: id ?? crypto.randomUUID(),
        planningId: createdPlanning.id,
        clubId: createdPlanning.clubId,
        ...rest,
      };
    });
    await db.insert(planningItem).values(itemsToInsert);
  }
  return created;
}

export async function updatePlanning(data: UpdatePlanningInput) {
  if (!data.id) return null;
  const { planningItems: _planningItems, ...planningData } = data;
  return db
    .update(planning)
    .set(planningData)
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
  const orgItems = await db.query.planningItem.findMany({
    where: eq(planningItem.planningId, originalId),
  });

  const newPlanning = await db
    .insert(planning)
    .values({
      clubId: org.clubId,
      name: newData.name ?? org.name,
      startDate: newData.startDate,
      endDate: newData.endDate,
    })
    .returning();
  const createdPlanning = newPlanning[0];
  if (!createdPlanning) return null;

  if (orgItems.length > 0) {
    const itemsToInsert = orgItems.map(({ id, planningId, ...rest }) => ({
      ...rest,
      id: crypto.randomUUID(),
      planningId: createdPlanning.id,
      clubId: createdPlanning.clubId,
    }));
    await db.insert(planningItem).values(itemsToInsert);
  }

  return createdPlanning;
}

export async function deletePlanning(planningId: PlanningId) {
  return db.delete(planning).where(eq(planning.id, planningId));
}

// ==================== PLANNING ACTIVITY ====================

export async function getPlanningActivityById(
  planningId: PlanningId,
  planningItemId: PlanningItemId,
) {
  if (!planningId || !planningItemId) return null;
  const item = await db.query.planningItem.findFirst({
    where: and(
      eq(planningItem.id, planningItemId),
      eq(planningItem.planningId, planningId),
    ),
    with: {
      activity: { columns: { name: true } },
      coach: { columns: { name: true } },
      room: { columns: { name: true } },
      site: { columns: { name: true } },
      club: { columns: { name: true } },
    },
  });
  if (!item) return null;
  const completedItem = await fillPlanningItems([item]);
  return completedItem[0];
}

// ==================== COURSES ====================

export async function getCourseForSlotDate(data: {
  planningId: PlanningId;
  planningItemId: PlanningItemId;
  date: Date;
}) {
  const found = await db.query.course.findFirst({
    where: and(
      eq(course.planningId, data.planningId),
      eq(course.planningItemId, data.planningItemId),
      between(course.date, startOfDay(data.date), endOfDay(data.date)),
    ),
  });
  return found ?? null;
}

export async function upsertCourseForSlotDate(data: {
  courseId?: CourseId;
  planningId: PlanningId;
  planningItemId: PlanningItemId;
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
            eq(course.planningItemId, data.planningItemId),
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
        eq(reservation.planningItemId, data.planningItemId),
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
        planningItemId: data.planningItemId,
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
  item: Omit<PlanningItemData, "id">;
}) {
  const plan = await db.query.planning.findFirst({
    where: eq(planning.id, data.planningId),
    columns: { clubId: true },
  });
  if (!plan) return null;
  return db
    .insert(planningItem)
    .values({
      id: crypto.randomUUID(),
      planningId: data.planningId,
      clubId: plan.clubId,
      ...data.item,
    })
    .returning();
}

export async function updatePlanningActivity(
  planningId: PlanningId,
  item: UpdatePlanningItemInput,
) {
  if (!item.id) return null;
  const { id, ...updates } = item;
  return db
    .update(planningItem)
    .set(updates)
    .where(
      and(eq(planningItem.id, id), eq(planningItem.planningId, planningId)),
    )
    .returning();
}

export async function deletePlanningActivity(
  planningId: PlanningId,
  planningItemId: PlanningItemId,
) {
  return db
    .update(planningItem)
    .set({ deleted: true })
    .where(
      and(
        eq(planningItem.id, planningItemId),
        eq(planningItem.planningId, planningId),
      ),
    )
    .returning();
}

// ==================== RESERVATIONS ====================

export async function createPlanningReservation(data: {
  date: Date;
  planningId: PlanningId;
  planningItemId: PlanningItemId;
  userId: UserId;
}) {
  return db.transaction(async (tx) => {
    const created = await tx
      .insert(reservation)
      .values({
        date: data.date,
        planningId: data.planningId,
        planningItemId: data.planningItemId,
        userId: data.userId,
        reservationDate: new Date(),
      })
      .returning();
    const newReservation = created[0];
    if (!newReservation) return created;

    const planItem = await tx.query.planningItem.findFirst({
      where: and(
        eq(planningItem.id, data.planningItemId),
        eq(planningItem.planningId, data.planningId),
      ),
    });
    if (!planItem) return created;

    const courseDate = getCourseStartDate(data.date, planItem.startTime);
    const existingCourse = await tx.query.course.findFirst({
      where: and(
        eq(course.planningId, data.planningId),
        eq(course.planningItemId, data.planningItemId),
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
      planningItemId: data.planningItemId,
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
  planningItemId: PlanningItemId;
  userId: UserId;
  slotNumber: number;
}) {
  return db
    .insert(reservation)
    .values({
      date: data.date,
      planningId: data.planningId,
      planningItemId: data.planningItemId,
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

    if (!existingReservation.planningId || !existingReservation.planningItemId)
      return deleted;

    const existingCourse = await tx.query.course.findFirst({
      where: and(
        eq(course.planningId, existingReservation.planningId),
        eq(course.planningItemId, existingReservation.planningItemId),
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
