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
  getClubDailyPlanning,
  getCoachDailyPlanning,
  getCoachPlanningForClub,
  getCourseForSlotDate,
  getMemberDailyPlanning,
  getPlanningActivityById,
  getPlanningById,
  getPlanningsForClub,
  updatePlanning,
  updatePlanningActivity,
  upsertCourseForSlotDate,
} from "@/db/dal";
import { dayNameEnum } from "@/db/schema/enums";
import {
  ZodClubId,
  ZodPlanningId,
  ZodPlanningItemId,
  ZodReservationId,
  ZodUserId,
} from "@/db/types";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import {
  courseSlotDateSchema,
  courseUpsertSchema,
  planningItemSchema,
  planningSchema,
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
    .input(
      z.object({
        planningId: ZodPlanningId,
        planningItemId: ZodPlanningItemId,
      }),
    )
    .query(({ input }) => {
      if (!input.planningId || !input.planningItemId) return null;
      return getPlanningActivityById(input.planningId, input.planningItemId);
    }),

  getCourseForSlotDate: protectedProcedure
    .input(courseSlotDateSchema)
    .query(async ({ input }) => {
      const course = await getCourseForSlotDate(input);
      return course ?? null;
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
        item: planningItemSchema.omit({ id: true }),
      }),
    )
    .mutation(({ input }) =>
      addPlanningActivity({
        planningId: input.planningId,
        item: input.item,
      }),
    ),

  updatePlanningActivity: protectedProcedure
    .input(
      z.object({
        planningId: ZodPlanningId,
        item: planningItemSchema.partial(),
      }),
    )
    .mutation(({ input }) =>
      updatePlanningActivity(input.planningId, input.item),
    ),

  upsertCourseForSlotDate: protectedProcedure
    .input(courseUpsertSchema)
    .mutation(({ input }) => upsertCourseForSlotDate(input)),

  deletePlanningActivity: protectedProcedure
    .input(
      z.object({
        planningId: ZodPlanningId,
        planningItemId: ZodPlanningItemId,
      }),
    )
    .mutation(({ input }) =>
      deletePlanningActivity(input.planningId, input.planningItemId),
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
        coachUserId: ZodUserId,
        day: z.enum(dayNameEnum.enumValues),
      }),
    )
    .query(({ input }) => getCoachDailyPlanning(input.coachUserId, input.day)),

  getCoachPlanningForClub: protectedProcedure
    .input(
      z.object({
        coachUserId: ZodUserId,
        clubId: ZodClubId,
      }),
    )
    .query(({ input }) =>
      getCoachPlanningForClub(input.coachUserId, input.clubId),
    ),

  getMemberDailyPlanning: protectedProcedure
    .input(
      z.object({
        memberId: ZodUserId,
        date: z.date(),
      }),
    )
    .query(async ({ input }) => {
      return getMemberDailyPlanning(input.memberId, input.date);
    }),

  createPlanningReservation: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        planningId: ZodPlanningId,
        planningItemId: ZodPlanningItemId,
        memberId: ZodUserId,
      }),
    )
    .mutation(({ input }) =>
      createPlanningReservation({
        date: input.date,
        planningId: input.planningId,
        planningItemId: input.planningItemId,
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
        planningItemId: ZodPlanningItemId,
        memberId: ZodUserId,
        slotNumber: z.number(),
      }),
    )
    .mutation(({ input }) =>
      createActivityReservation({
        date: input.date,
        planningId: input.planningId,
        planningItemId: input.planningItemId,
        userId: input.memberId,
        slotNumber: input.slotNumber,
      }),
    ),
});
