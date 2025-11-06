import { and, asc, eq, gte, inArray, lte, or } from "drizzle-orm";
import z from "zod";

import { endOfDay, startOfDay } from "date-fns";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { planning, planningActivity, reservation } from "@/db/schema/planning";
import { dayNameEnum, roomReservationEnum } from "@/db/schema/enums";
import { getDayName } from "@/lib/dates/days";
import { userCoach } from "@/db/schema/user";
import { activity } from "@/db/schema/club";
import { DayName } from "@/lib/dates/data";
import { user } from "@/db/schema/auth";
import { isCUID } from "@/lib/utils";
import { db } from "@/db";

const planningObject = z.object({
  id: z.cuid2(),
  clubId: z.cuid2(),
  startDate: z.date().default(new Date(Date.now())),
  siteId: z.cuid2().optional(),
  roomId: z.cuid2().optional(),
  endDate: z.date().optional(),
  name: z.string().optional(),
});

const planningActivityObject = z.object({
  id: z.cuid2(),
  planningId: z.cuid2(),
  activityId: z.cuid2(),
  siteId: z.cuid2(),
  roomId: z.cuid2().optional(),
  day: z.enum(dayNameEnum.enumValues),
  startTime: z.string(),
  duration: z.number(),
  coachId: z.cuid2().optional(),
});

export async function getClubDailyPlanning(
  clubId: string,
  day: (typeof dayNameEnum.enumValues)[number],
) {
  if (!isCUID(clubId)) return null;
  const clubPlanning = await db.query.planning.findFirst({
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
  // TODO: manage exception days
  return clubPlanning;
}

export async function getPlanningsForClub(clubId: string) {
  if (!isCUID(clubId)) return [];
  return await db.query.planning.findMany({
    where: eq(planning.clubId, clubId),
    orderBy: asc(planning.startDate),
  });
}

export async function getPlanningById(planningId: string) {
  if (!isCUID(planningId)) return null;
  return await db.query.planning.findFirst({
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

export async function getCoachDailyPlanning(coachId: string, day: DayName) {
  if (!isCUID(coachId)) return [];
  const coachPlanning = await db.query.planning.findMany({
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
  // TODO: manage exception days
  return coachPlanning;
}

export const planningRouter = createTRPCRouter({
  getPlanningsForClub: protectedProcedure
    .input(z.string())
    .query(({ input }) => getPlanningsForClub(input)),

  getPlanningById: protectedProcedure
    .input(z.cuid2())
    .query(async ({ input }) => await getPlanningById(input)),
  getPlanningActivityById: protectedProcedure
    .input(z.cuid2().nullable())
    .query(({ input }) => {
      if (!input) return null;
      return db.query.planningActivity.findFirst({
        where: eq(planningActivity.id, input),
        with: {
          activity: true,
          site: {
            with: { rooms: true },
          },
          room: true,
          coach: true,
        },
      });
    }),
  createPlanningForClub: protectedProcedure
    .input(planningObject.omit({ id: true }))
    .mutation(({ input }) => db.insert(planning).values(input).returning()),
  updatePlanningForClub: protectedProcedure
    .input(planningObject.partial())
    .mutation(({ input }) =>
      db
        .update(planning)
        .set(input)
        .where(eq(planning.id, input.id ?? ""))
        .returning(),
    ),
  duplicatePlanningForClub: protectedProcedure
    .input(planningObject.partial())
    .mutation(async ({ input }) => {
      const org = await db.query.planning.findFirst({
        where: eq(planning.id, input.id ?? ""),
        with: { planningActivities: true },
      });
      if (!org) return null;
      return db.transaction(async (tx) => {
        const newPlanning = await tx
          .insert(planning)
          .values({
            clubId: org.clubId,
            name: input.name ?? org.name,
            startDate: input.startDate,
            endDate: input.endDate,
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
    }),
  deletePlanning: protectedProcedure
    .input(z.string())
    .mutation(({ input }) => db.delete(planning).where(eq(planning.id, input))),
  addPlanningActivity: protectedProcedure
    .input(planningActivityObject.omit({ id: true }))
    .mutation(({ input }) =>
      db.insert(planningActivity).values(input).returning(),
    ),
  updatePlanningActivity: protectedProcedure
    .input(planningActivityObject.partial())
    .mutation(({ input }) =>
      db
        .update(planningActivity)
        .set(input)
        .where(eq(planningActivity.id, input.id ?? ""))
        .returning(),
    ),
  deletePlanningActivity: protectedProcedure
    .input(z.string())
    .mutation(({ input }) =>
      db
        .delete(planningActivity)
        .where(eq(planningActivity.id, input))
        .returning(),
    ),
  getClubDailyPlanning: publicProcedure
    .input(
      z.object({
        clubId: z.cuid2(),
        day: z.enum(dayNameEnum.enumValues),
      }),
    )
    .query(({ input }) => getClubDailyPlanning(input.clubId, input.day)),
  getCoachDailyPlanning: protectedProcedure
    .input(
      z.object({
        coachId: z.cuid2(),
        day: z.enum(dayNameEnum.enumValues),
      }),
    )
    .query(
      async ({ input }) =>
        await getCoachDailyPlanning(input.coachId, input.day),
    ),
  getCoachPlanningForClub: protectedProcedure
    .input(
      z.object({
        coachId: z.cuid2(),
        clubId: z.cuid2(),
      }),
    )
    .query(async ({ input }) => {
      const coachPlanning = await db.query.planning.findFirst({
        where: and(
          eq(planning.clubId, input.clubId),
          lte(planning.startDate, new Date(Date.now())),
        ),
        with: {
          club: true,
          planningActivities: {
            where: eq(planningActivity.coachId, input.coachId),
            with: {
              activity: true,
              coach: true,
              room: true,
              site: true,
            },
          },
        },
      });
      // TODO: manage exception days
      return coachPlanning;
    }),
  getMemberDailyPlanning: protectedProcedure
    .input(
      z.object({
        memberId: z.cuid2(),
        date: z.date(),
      }),
    )
    .query(async ({ input }) => {
      const userData = await db.query.user.findFirst({
        where: eq(user.id, input.memberId),
        with: {
          memberData: {
            with: {
              clubs: true,
              subscriptions: {
                with: {
                  subscription: {
                    with: {
                      activitieGroups: true,
                      activities: true,
                      rooms: true,
                      sites: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const clubIds = Array.from(
        new Set(userData?.memberData?.clubs.map((c) => c.clubId)),
      );

      const planningClubs = await db.query.planning.findMany({
        where: and(
          lte(planning.startDate, new Date(Date.now())),
          inArray(planning.clubId, clubIds),
        ),
        with: { club: true },
      });

      // Infer types from actual query results
      type PlanningWithClub = (typeof planningClubs)[number];

      const planningData: Array<
        PlanningWithClub & {
          activities: Array<
            Omit<
              NonNullable<
                Awaited<ReturnType<typeof db.query.planningActivity.findMany>>
              >[number],
              "reservations"
            > & {
              activity: NonNullable<
                Awaited<ReturnType<typeof db.query.activity.findFirst>>
              >;
              site: NonNullable<
                Awaited<ReturnType<typeof db.query.site.findFirst>>
              >;
              room: NonNullable<
                Awaited<ReturnType<typeof db.query.room.findFirst>>
              > | null;
              coach: typeof userCoach.$inferSelect | null;
              reservations: Array<{ id: string; date: Date }>;
            }
          >;
          withNoCalendar: Array<
            Omit<
              NonNullable<
                Awaited<ReturnType<typeof db.query.activity.findMany>>
              >[number],
              "reservations" | "rooms"
            > & {
              rooms: Array<{
                id: string;
                name: string;
                capacity: number;
                reservation: (typeof roomReservationEnum.enumValues)[number];
              }>;
              reservations: Array<{ id: string; date: Date; roomName: string }>;
            }
          >;
        }
      > = [];

      const dayName = getDayName(input.date);

      for (const planningClub of planningClubs) {
        const sub = userData?.memberData?.subscriptions
          .flatMap((s) => s.subscription)
          .filter((s) => s.clubId === planningClub.clubId);

        // Build dynamic filters for planningActivity
        const planningActivityConditions: ReturnType<typeof and>[] = [];
        const activityConditions: ReturnType<typeof and>[] = [];

        for (const s of sub ?? []) {
          // Build activity/activity group filter
          const activityFilters: ReturnType<typeof or>[] = [];

          if (s.mode === "ACTIVITY_GROUP" && s.activitieGroups.length > 0) {
            // Fetch activity IDs for this subscription's activity groups
            const activityGroupIds = s.activitieGroups.map(
              (ag) => ag.activityGroupId,
            );
            const activitiesFromGroups = await db.query.activity.findMany({
              where: inArray(activity.groupId, activityGroupIds),
              columns: { id: true },
            });
            const activityIds = activitiesFromGroups.map((a) => a.id);
            if (activityIds.length > 0) {
              activityFilters.push(
                inArray(planningActivity.activityId, activityIds),
              );
            }
          }

          if (s.mode === "ACTIVITY" && s.activities.length > 0) {
            const activityIds = s.activities.map((a) => a.activityId);
            activityFilters.push(
              inArray(planningActivity.activityId, activityIds),
            );
          }

          // Build site/room restriction filter
          const restrictionFilters: ReturnType<typeof or>[] = [];
          if (s.restriction === "SITE" && s.sites.length > 0) {
            const siteIds = s.sites.map((site) => site.siteId);
            restrictionFilters.push(inArray(planningActivity.siteId, siteIds));
          }
          if (s.restriction === "ROOM" && s.rooms.length > 0) {
            const roomIds = s.rooms.map((room) => room.roomId);
            restrictionFilters.push(inArray(planningActivity.roomId, roomIds));
          }

          // Combine activity and restriction filters for planningActivity
          // Each subscription creates an AND condition: (activity OR activityGroup) AND (site OR room)
          if (activityFilters.length > 0 || restrictionFilters.length > 0) {
            const combinedFilters: ReturnType<typeof and>[] = [];
            if (activityFilters.length > 0) {
              combinedFilters.push(or(...activityFilters));
            }
            if (restrictionFilters.length > 0) {
              combinedFilters.push(or(...restrictionFilters));
            }
            if (combinedFilters.length > 0) {
              planningActivityConditions.push(and(...combinedFilters));
            }
          }

          // Build filters for activities without calendar
          const activityNoCalFilters: ReturnType<typeof or>[] = [];
          if (s.mode === "ACTIVITY_GROUP" && s.activitieGroups.length > 0) {
            const activityGroupIds = s.activitieGroups.map(
              (ag) => ag.activityGroupId,
            );
            activityNoCalFilters.push(
              inArray(activity.groupId, activityGroupIds),
            );
          }
          if (s.mode === "ACTIVITY" && s.activities.length > 0) {
            const activityIds = s.activities.map((a) => a.activityId);
            activityNoCalFilters.push(inArray(activity.id, activityIds));
          }

          if (activityNoCalFilters.length > 0) {
            activityConditions.push(or(...activityNoCalFilters));
          }
        }

        // Build the final where conditions
        const planningActivityWhereConditions: ReturnType<typeof and>[] = [
          eq(planningActivity.day, dayName),
          eq(planningActivity.planningId, planningClub.id),
        ];

        // If there are subscription filters, add them as OR conditions
        // This means: show activities that match ANY of the subscriptions
        if (planningActivityConditions.length > 0) {
          planningActivityWhereConditions.push(
            or(...planningActivityConditions),
          );
        }

        const activityWhereConditions: ReturnType<typeof and>[] = [
          eq(activity.clubId, planningClub.clubId),
          eq(activity.noCalendar, true),
        ];

        if (activityConditions.length > 0) {
          activityWhereConditions.push(or(...activityConditions));
        }

        // Get start and end of the input date for filtering reservation
        const pa = await db.query.planningActivity.findMany({
          where: and(...planningActivityWhereConditions),
          with: {
            activity: true,
            coach: true,
            room: true,
            site: true,
            reservations: {
              where: and(
                gte(reservation.date, startOfDay(new Date(input.date))),
                lte(reservation.date, endOfDay(new Date(input.date))),
              ),
            },
          },
        });

        const withNoCalendar = await db.query.activity.findMany({
          where: and(...activityWhereConditions),
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
                gte(reservation.date, startOfDay(new Date(input.date))),
                lte(reservation.date, endOfDay(new Date(input.date))),
              ),
              with: {
                room: true,
              },
            },
          },
        });
        planningData.push({
          ...planningClub,
          activities: pa.map((p) => {
            // Filter reservations for this specific planning activity and date
            const allReservations = p.reservations.filter(
              (r) => r.planningActivityId === p.id,
            );
            // Map reservations: use planningActivityId as id for member's reservations
            return {
              ...p,
              reservations: allReservations.map((r) => ({
                id:
                  r.userId === input.memberId
                    ? (r.planningActivityId ?? p.id)
                    : r.id, // Use planningActivityId for member's reservation, id for others
                date: r.date,
              })),
            };
          }),
          withNoCalendar: withNoCalendar.map((wnc) => {
            // Filter reservations for this specific activity and date
            const allReservations = (wnc.reservations ?? []).filter(
              (r) => r.activityId === wnc.id,
            );
            return {
              ...wnc,
              rooms: (wnc.rooms ?? []).map((ra) => ({
                id: ra.room.id,
                name: ra.room.name,
                capacity: ra.room.capacity,
                reservation: ra.room.reservation ?? "NONE",
              })),
              reservations: allReservations.map((r) => ({
                id:
                  r.userId === input.memberId ? (r.activityId ?? wnc.id) : r.id, // Use activityId for member's reservation, id for others
                date: r.date,
                roomName: r.room?.name ?? "",
              })),
            };
          }),
        });
      }

      // TODO: manage exception days
      return planningData;
    }),
  createPlanningReservation: protectedProcedure
    .input(
      z.object({
        memberId: z.cuid2(),
        planningActivityId: z.cuid2(),
        date: z.date(),
      }),
    )
    .mutation(({ input }) =>
      db
        .insert(reservation)
        .values({
          date: input.date,
          planningActivityId: input.planningActivityId,
          userId: input.memberId,
        })
        .returning(),
    ),
  deleteReservation: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) =>
      db.delete(reservation).where(eq(reservation.id, input)),
    ),
  createActivityReservation: protectedProcedure
    .input(
      z.object({
        memberId: z.cuid2(),
        activityId: z.cuid2(),
        date: z.date(),
        activitySlot: z.number(),
        roomId: z.cuid2(),
      }),
    )
    .mutation(({ input }) =>
      db
        .insert(reservation)
        .values({
          date: input.date,
          activityId: input.activityId,
          userId: input.memberId,
          activitySlot: input.activitySlot,
          roomId: input.roomId,
        })
        .returning(),
    ),
});
