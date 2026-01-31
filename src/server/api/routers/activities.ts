import { z } from "zod";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  affectActivityToRoom,
  createActivity,
  createActivityGroup,
  deleteActivity,
  deleteActivityGroup,
  getActivitiesForClub,
  getActivityById,
  getActivityByName,
  getActivityGroupById,
  getActivityGroupsForUser,
  getAllActivitiesForGroup,
  getAllActivityGroups,
  getAllClubsForGroup,
  removeActivityFromRoom,
  updateActivity,
  updateActivityGroup,
} from "@/db/dal";
import { activityGroup } from "@/db/schema/club";
import {
  ZodActivityGroupId,
  ZodActivityId,
  ZodClubId,
  ZodUserId,
} from "@/db/types";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import {
  createActivitySchema,
  roomActivitySchema,
  updateActivityGroupSchema,
  updateActivitySchema,
} from "@/schemas/activities";
import {
  requireAdmin,
  requireAdminOrOwner,
  requireAdminOrSelf,
} from "@/server/lib/userTools";

export const activityRouter = createTRPCRouter({
  getActivityById: protectedProcedure
    .input(ZodActivityId)
    .query(({ input }) => getActivityById(input)),

  getActivityByName: publicProcedure
    .input(z.string())
    .query(({ input }) => getActivityByName(input)),

  getActivityGroupById: protectedProcedure
    .input(ZodActivityGroupId)
    .query(({ input }) => getActivityGroupById(input)),

  getActivityGroupsForUser: protectedProcedure
    .input(ZodUserId)
    .query(({ input }) => getActivityGroupsForUser(input)),

  getAllActivityGroups: protectedProcedure.query(() => getAllActivityGroups()),

  getActivitiesForClub: protectedProcedure
    .input(z.object({ clubId: ZodClubId, userId: ZodUserId }))
    .query(({ ctx, input }) => {
      requireAdminOrSelf(ctx.user, input.userId);
      return getActivitiesForClub(input.clubId);
    }),

  getAllActivitiesForGroup: protectedProcedure
    .input(ZodActivityGroupId)
    .query(({ ctx, input }) => {
      requireAdmin(ctx.user);
      return getAllActivitiesForGroup(input);
    }),

  getAllClubsForGroup: protectedProcedure
    .input(ZodActivityGroupId)
    .query(({ ctx, input }) => {
      requireAdmin(ctx.user);
      return getAllClubsForGroup(input);
    }),

  createActivity: protectedProcedure
    .input(createActivitySchema)
    .mutation(({ input }) => createActivity(input)),

  updateActivity: protectedProcedure
    .input(updateActivitySchema)
    .mutation(({ input }) => updateActivity(input)),

  deleteActivity: protectedProcedure
    .input(
      z.object({
        activityId: ZodActivityId,
        clubId: ZodClubId,
      }),
    )
    .mutation(({ input }) => deleteActivity(input.activityId)),

  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        userId: ZodUserId.optional().nullable(),
        default: z.boolean().optional().default(false),
      }),
    )
    .mutation(({ input }) =>
      createActivityGroup({
        name: input.name,
        coachUserId: input.userId,
        default: input.default,
      }),
    ),

  updateGroup: protectedProcedure
    .input(updateActivityGroupSchema)
    .mutation(({ input }) => updateActivityGroup(input)),

  deleteGroup: protectedProcedure
    .input(
      z.object({
        groupId: ZodActivityGroupId,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await db.query.activityGroup.findFirst({
        where: eq(activityGroup.id, input.groupId),
      });
      requireAdminOrOwner(ctx.user, group?.coachUserId);
      return deleteActivityGroup(input.groupId);
    }),

  affectToRoom: protectedProcedure
    .input(roomActivitySchema)
    .mutation(({ input }) =>
      affectActivityToRoom(input.roomId, input.activityId),
    ),

  removeFromRoom: protectedProcedure
    .input(roomActivitySchema)
    .mutation(({ input }) =>
      removeActivityFromRoom(input.roomId, input.activityId),
    ),
});
