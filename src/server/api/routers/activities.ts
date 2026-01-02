import { z } from "zod";

import { eq } from "drizzle-orm";

import {
  getActivityById,
  getActivityByName,
  getActivityGroupById,
  getActivityGroupsForUser,
  getAllActivityGroups,
  getActivitiesForClub,
  getAllActivitiesForGroup,
  getAllClubsForGroup,
  createActivity,
  updateActivity,
  deleteActivity,
  createActivityGroup,
  updateActivityGroup,
  deleteActivityGroup,
  affectActivityToRoom,
  removeActivityFromRoom,
} from "@/db/dal";
import {
  requireAdmin,
  requireAdminOrSelf,
  requireAdminOrOwner,
} from "@/server/lib/userTools";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { activityGroup } from "@/db/schema/club";
import { db } from "@/db";

const activityObject = z.object({
  id: z.cuid2(),
  name: z.string(),
  noCalendar: z.boolean().default(false),
  reservationDuration: z.number().default(60),
  clubId: z.cuid2(),
  groupId: z.cuid2(),
});

export const activityRouter = createTRPCRouter({
  getActivityById: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => getActivityById(input)),

  getActivityByName: publicProcedure
    .input(z.string())
    .query(({ input }) => getActivityByName(input)),

  getActivityGroupById: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => getActivityGroupById(input)),

  getActivityGroupsForUser: protectedProcedure
    .input(z.string())
    .query(({ input }) => getActivityGroupsForUser(input)),

  getAllActivityGroups: protectedProcedure.query(() => getAllActivityGroups()),

  getActivitiesForClub: protectedProcedure
    .input(z.object({ clubId: z.cuid2(), userId: z.string() }))
    .query(({ ctx, input }) => {
      requireAdminOrSelf(ctx.user, input.userId);
      return getActivitiesForClub(input.clubId);
    }),

  getAllActivitiesForGroup: protectedProcedure
    .input(z.cuid2())
    .query(({ ctx, input }) => {
      requireAdmin(ctx.user);
      return getAllActivitiesForGroup(input);
    }),

  getAllClubsForGroup: protectedProcedure
    .input(z.cuid2())
    .query(({ ctx, input }) => {
      requireAdmin(ctx.user);
      return getAllClubsForGroup(input);
    }),

  createActivity: protectedProcedure
    .input(activityObject.omit({ id: true }))
    .mutation(({ input }) => createActivity(input)),

  updateActivity: protectedProcedure
    .input(activityObject.partial())
    .mutation(({ input }) => updateActivity(input)),

  deleteActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.cuid2(),
        clubId: z.cuid2(),
      }),
    )
    .mutation(({ input }) => deleteActivity(input.activityId)),

  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        userId: z.string().optional().nullable(),
        default: z.boolean().optional().default(false),
      }),
    )
    .mutation(({ input }) =>
      createActivityGroup({
        name: input.name,
        coachId: input.userId,
        default: input.default,
      }),
    ),

  updateGroup: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        name: z.string(),
        default: z.boolean().optional().default(false),
      }),
    )
    .mutation(({ input }) => updateActivityGroup(input)),

  deleteGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.cuid2(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await db.query.activityGroup.findFirst({
        where: eq(activityGroup.id, input.groupId),
      });
      requireAdminOrOwner(ctx.user, group?.coachId);
      return deleteActivityGroup(input.groupId);
    }),

  affectToRoom: protectedProcedure
    .input(
      z.object({
        roomId: z.cuid2(),
        activityId: z.cuid2(),
      }),
    )
    .mutation(({ input }) =>
      affectActivityToRoom(input.roomId, input.activityId),
    ),

  removeFromRoom: protectedProcedure
    .input(
      z.object({
        roomId: z.cuid2(),
        activityId: z.cuid2(),
      }),
    )
    .mutation(({ input }) =>
      removeActivityFromRoom(input.roomId, input.activityId),
    ),
});
