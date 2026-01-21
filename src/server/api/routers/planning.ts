import { and, inArray, or } from "drizzle-orm";
import z from "zod";

import {
  addPlanningActivity,
  createActivityReservation,
  createPlanning,
  createPlanningReservation,
  deletePlanning,
  deletePlanningActivity,
  deleteReservation,
  duplicatePlanning,
  getActivitiesForGroups,
  getActivitiesWithNoCalendar,
  getClubDailyPlanning,
  getCoachDailyPlanning,
  getCoachPlanningForClub,
  getMemberDataWithSubscriptions,
  getPlanningActivitiesWithFilters,
  getPlanningActivityById,
  getPlanningById,
  getPlanningsForClub,
  getPlanningsForClubIds,
  updatePlanning,
  updatePlanningActivity,
} from "@/db/dal";
import { activity } from "@/db/schema/club";
import { dayNameEnum, roomReservationEnum } from "@/db/schema/enums";
import { planningActivity } from "@/db/schema/planning";
import { userCoach } from "@/db/schema/user";
import { getDayName } from "@/lib/dates/days";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";

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
  coachId: z.string().optional(),
});

export {
  getClubDailyPlanning,
  getCoachDailyPlanning,
  getPlanningById,
  getPlanningsForClub,
};

export const planningRouter = createTRPCRouter({
  getPlanningsForClub: protectedProcedure
    .input(z.string())
    .query(({ input }) => getPlanningsForClub(input)),

  getPlanningById: protectedProcedure
    .input(z.cuid2())
    .query(async ({ input }) => getPlanningById(input)),

  getPlanningActivityById: protectedProcedure
    .input(z.cuid2().nullable())
    .query(({ input }) => {
      if (!input) return null;
      return getPlanningActivityById(input);
    }),

  createPlanningForClub: protectedProcedure
    .input(planningObject.omit({ id: true }))
    .mutation(({ input }) => createPlanning(input)),

  updatePlanningForClub: protectedProcedure
    .input(planningObject.partial())
    .mutation(({ input }) => updatePlanning({ id: input.id ?? "", ...input })),

  duplicatePlanningForClub: protectedProcedure
    .input(planningObject.partial())
    .mutation(({ input }) =>
      duplicatePlanning(input.id ?? "", {
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    ),

  deletePlanning: protectedProcedure
    .input(z.string())
    .mutation(({ input }) => deletePlanning(input)),

  addPlanningActivity: protectedProcedure
    .input(planningActivityObject.omit({ id: true }))
    .mutation(({ input }) => addPlanningActivity(input)),

  updatePlanningActivity: protectedProcedure
    .input(planningActivityObject.partial())
    .mutation(({ input }) =>
      updatePlanningActivity({ id: input.id ?? "", ...input }),
    ),

  deletePlanningActivity: protectedProcedure
    .input(z.string())
    .mutation(({ input }) => deletePlanningActivity(input)),

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
        coachId: z.string(),
        day: z.enum(dayNameEnum.enumValues),
      }),
    )
    .query(({ input }) => getCoachDailyPlanning(input.coachId, input.day)),

  getCoachPlanningForClub: protectedProcedure
    .input(
      z.object({
        coachId: z.string(),
        clubId: z.cuid2(),
      }),
    )
    .query(({ input }) => getCoachPlanningForClub(input.coachId, input.clubId)),

  getMemberDailyPlanning: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        date: z.date(),
      }),
    )
    .query(async ({ input }) => {
      const userData = await getMemberDataWithSubscriptions(input.memberId);
      const clubIds = Array.from(
        new Set(
          userData?.memberData?.subscriptions.map(
            (s) => s.subscription.club.id,
          ),
        ),
      );
      const planningClubs = await getPlanningsForClubIds(clubIds);

      type PlanningWithClub = (typeof planningClubs)[number];

      const planningData: Array<
        PlanningWithClub & {
          activities: Array<{
            id: string;
            day: (typeof dayNameEnum.enumValues)[number];
            startTime: string;
            duration: number;
            planningId: string;
            activityId: string;
            coachId: string | null;
            siteId: string;
            roomId: string | null;
            activity: NonNullable<
              Awaited<ReturnType<typeof getPlanningActivityById>>
            >["activity"];
            site: NonNullable<
              Awaited<ReturnType<typeof getPlanningActivitiesWithFilters>>
            >[number]["site"];
            room:
              | NonNullable<
                  Awaited<ReturnType<typeof getPlanningActivityById>>
                >["room"]
              | null;
            coach: typeof userCoach.$inferSelect | null;
            reservations: Array<{ id: string; date: Date }>;
          }>;
          withNoCalendar: Array<{
            id: string;
            name: string;
            clubId: string;
            reservationDuration: number | null;
            rooms: Array<{
              id: string;
              name: string;
              capacity: number;
              reservation: (typeof roomReservationEnum.enumValues)[number];
            }>;
            reservations: Array<{ id: string; date: Date; roomName: string }>;
          }>;
        }
      > = [];

      const dayName = getDayName(input.date);

      for (const planningClub of planningClubs) {
        const sub = userData?.memberData?.subscriptions
          .flatMap((s) => s.subscription)
          .filter((s) => s.clubId === planningClub.clubId);

        const planningActivityConditions: ReturnType<typeof and>[] = [];
        const activityConditions: ReturnType<typeof and>[] = [];

        for (const s of sub ?? []) {
          const activityFilters: ReturnType<typeof or>[] = [];

          if (s.mode === "ACTIVITY_GROUP" && s.activitieGroups.length > 0) {
            const activityGroupIds = s.activitieGroups.map(
              (ag) => ag.activityGroupId,
            );
            const activitiesFromGroups =
              await getActivitiesForGroups(activityGroupIds);
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

          const restrictionFilters: ReturnType<typeof or>[] = [];
          if (s.restriction === "SITE" && s.sites.length > 0) {
            const siteIds = s.sites.map((site) => site.siteId);
            restrictionFilters.push(inArray(planningActivity.siteId, siteIds));
          }
          if (s.restriction === "ROOM" && s.rooms.length > 0) {
            const roomIds = s.rooms.map((room) => room.roomId);
            restrictionFilters.push(inArray(planningActivity.roomId, roomIds));
          }

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

        const additionalPlanningConditions =
          planningActivityConditions.length > 0
            ? or(...planningActivityConditions)
            : undefined;

        const additionalActivityConditions =
          activityConditions.length > 0 ? or(...activityConditions) : undefined;

        const pa = await getPlanningActivitiesWithFilters(
          planningClub.id,
          dayName,
          input.date,
          additionalPlanningConditions,
        );

        const withNoCalendar = await getActivitiesWithNoCalendar(
          planningClub.clubId,
          input.date,
          additionalActivityConditions,
        );

        planningData.push({
          ...planningClub,
          activities: pa.map((p) => {
            const allReservations = p.reservations.filter(
              (r) => r.planningActivityId === p.id,
            );
            return {
              ...p,
              reservations: allReservations.map((r) => ({
                id:
                  r.userId === input.memberId
                    ? (r.planningActivityId ?? p.id)
                    : r.id,
                date: r.date,
              })),
            };
          }),
          withNoCalendar: withNoCalendar.map((wnc) => {
            const allReservations = (wnc.reservations ?? []).filter(
              (r) => r.activityId === wnc.id,
            );
            return {
              id: wnc.id,
              name: wnc.name,
              clubId: wnc.clubId,
              reservationDuration: wnc.reservationDuration,
              rooms: (wnc.rooms ?? []).map((ra) => ({
                id: ra.room.id,
                name: ra.room.name,
                capacity: ra.room.capacity,
                reservation: ra.room.reservation ?? "NONE",
              })),
              reservations: allReservations.map((r) => ({
                id:
                  r.userId === input.memberId ? (r.activityId ?? wnc.id) : r.id,
                date: r.date,
                roomName: r.room?.name ?? "",
              })),
            };
          }),
        });
      }

      return planningData;
    }),

  createPlanningReservation: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        planningActivityId: z.cuid2(),
        date: z.date(),
      }),
    )
    .mutation(({ input }) =>
      createPlanningReservation({
        date: input.date,
        planningActivityId: input.planningActivityId,
        userId: input.memberId,
      }),
    ),

  deleteReservation: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) => deleteReservation(input)),

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
      createActivityReservation({
        date: input.date,
        activityId: input.activityId,
        userId: input.memberId,
        activitySlot: input.activitySlot,
        roomId: input.roomId,
      }),
    ),
});
