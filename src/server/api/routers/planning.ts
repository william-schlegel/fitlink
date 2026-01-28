import { inArray, or } from "drizzle-orm";
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
  fillPlanningItems,
  getActivitiesForGroups,
  getClubDailyPlanning,
  getCoachDailyPlanning,
  getCoachPlanningForClub,
  getMemberDataWithSubscriptions,
  getPlanningActivityById,
  getPlanningById,
  getPlanningsForClub,
  getPlanningsForClubIds,
  updatePlanning,
  updatePlanningActivity,
} from "@/db/dal";
import { activity } from "@/db/schema/club";
import { dayNameEnum } from "@/db/schema/enums";
import {
  ActivityId,
  ClubId,
  RoomId,
  SiteId,
  ZodClubId,
  ZodPlanningId,
  ZodReservationId,
  ZodUserId,
} from "@/db/types";
import { getDayName } from "@/lib/dates/days";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import {
  planningItemSchema,
  planningSchema,
  PlanningSearchReturnData,
} from "@/schemas";

export {
  getClubDailyPlanning,
  getCoachDailyPlanning,
  getPlanningById,
  getPlanningsForClub,
};

export const planningRouter = createTRPCRouter({
  getPlanningsForClub: protectedProcedure
    .input(z.object({ clubId: ZodClubId }))
    .query(({ input }) => getPlanningsForClub(input.clubId)),

  getPlanningById: protectedProcedure
    .input(z.object({ planningId: ZodPlanningId }))
    .query(async ({ input }) => getPlanningById(input.planningId)),

  getPlanningActivityById: protectedProcedure
    .input(z.object({ planningId: ZodPlanningId, slotId: z.string() }))
    .query(({ input }) => {
      if (!input.planningId || !input.slotId) return null;
      return getPlanningActivityById(input.planningId, input.slotId);
    }),

  createPlanningForClub: protectedProcedure
    .input(planningSchema.omit({ id: true }))
    .mutation(({ input }) => createPlanning(input)),

  updatePlanningForClub: protectedProcedure
    .input(planningSchema.partial())
    .mutation(({ input }) => updatePlanning(input)),

  duplicatePlanningForClub: protectedProcedure
    .input(
      z.object({
        id: ZodPlanningId,
        name: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .mutation(({ input }) =>
      duplicatePlanning(input.id, {
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    ),

  deletePlanning: protectedProcedure
    .input(ZodPlanningId)
    .mutation(({ input }) => deletePlanning(input)),

  addPlanningActivity: protectedProcedure
    .input(
      z.object({
        planningId: ZodPlanningId,
        item: planningItemSchema.omit({ slotId: true }),
      }),
    )
    .mutation(({ input }) =>
      addPlanningActivity({
        planningId: input.planningId,
        item: input.item,
      }),
    ),

  updatePlanningActivity: protectedProcedure
    .input(z.object({ planningId: ZodPlanningId, item: planningItemSchema }))
    .mutation(({ input }) =>
      updatePlanningActivity(input.planningId, input.item),
    ),

  deletePlanningActivity: protectedProcedure
    .input(z.object({ planningId: ZodPlanningId, slotId: z.string() }))
    .mutation(({ input }) =>
      deletePlanningActivity(input.planningId, input.slotId),
    ),

  getClubDailyPlanning: publicProcedure
    .input(
      z.object({
        clubId: ZodClubId,
        day: z.enum(dayNameEnum.enumValues),
      }),
    )
    .query(({ input }) => getClubDailyPlanning(input.clubId, input.day)),

  getCoachDailyPlanning: protectedProcedure
    .input(
      z.object({
        coachId: ZodUserId,
        day: z.enum(dayNameEnum.enumValues),
      }),
    )
    .query(({ input }) => getCoachDailyPlanning(input.coachId, input.day)),

  getCoachPlanningForClub: protectedProcedure
    .input(
      z.object({
        coachId: ZodUserId,
        clubId: ZodClubId,
      }),
    )
    .query(({ input }) => getCoachPlanningForClub(input.coachId, input.clubId)),

  getMemberDailyPlanning: protectedProcedure
    .input(
      z.object({
        memberId: ZodUserId,
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
      ) as ClubId[];
      const planningClubs = await getPlanningsForClubIds(clubIds);
      const dayName = getDayName(input.date);
      const planningData: PlanningSearchReturnData[] = [];

      for (const planningClub of planningClubs) {
        const sub = userData?.memberData?.subscriptions
          .flatMap((s) => s.subscription)
          .filter((s) => s.clubId === planningClub.clubId);

        const activityIds = new Set<ActivityId>();
        const siteIds = new Set<SiteId>();
        const roomIds = new Set<RoomId>();

        for (const s of sub ?? []) {
          if (s.mode === "ACTIVITY_GROUP" && s.activitieGroups.length > 0) {
            const activityGroupIds = s.activitieGroups.map(
              (ag) => ag.activityGroupId,
            );
            const activitiesFromGroups =
              await getActivitiesForGroups(activityGroupIds);
            for (const a of activitiesFromGroups) {
              activityIds.add(a.id);
            }
          }

          if (s.mode === "ACTIVITY" && s.activities.length > 0) {
            for (const a of s.activities) {
              activityIds.add(a.activityId);
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
        }

        const planItems = await fillPlanningItems(planningClub.planningItems, {
          day: dayName,
          activityIds: Array.from(activityIds),
        });

        const clb = planningClub.club?.find(
          (c) => c.clubId === planningClub.clubId,
        );

        planningData.push({
          clubId: planningClub.clubId,
          clubName: clb?.name ?? "",
          siteId: planningClub.siteId,
          siteName: planningClub.site?.[0]?.name ?? "",
          roomId: planningClub.roomId,
          roomName: planningClub.room?.[0]?.name ?? "",
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

      return planningData;
    }),

  createPlanningReservation: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        planningId: ZodPlanningId,
        slotId: z.string(),
        memberId: ZodUserId,
      }),
    )
    .mutation(({ input }) =>
      createPlanningReservation({
        date: input.date,
        planningId: input.planningId,
        slotId: input.slotId,
        userId: input.memberId,
      }),
    ),

  deleteReservation: protectedProcedure
    .input(ZodReservationId)
    .mutation(({ input }) => deleteReservation(input)),

  createActivityReservation: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        planningId: ZodPlanningId,
        slotId: z.string(),
        memberId: ZodUserId,
        slotNumber: z.number(),
      }),
    )
    .mutation(({ input }) =>
      createActivityReservation({
        date: input.date,
        planningId: input.planningId,
        slotId: input.slotId,
        userId: input.memberId,
        slotNumber: input.slotNumber,
      }),
    ),
});
