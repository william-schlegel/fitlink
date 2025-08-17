import { db } from "@/db";
import {
  activity,
  activityGroup,
  club,
  roomActivities,
} from "@/db/schema/club";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

const activityObject = z.object({
  id: z.cuid2(),
  name: z.string(),
  noCalendar: z.boolean().default(false),
  reservationDuration: z.number().default(60),
  clubId: z.cuid2(),
  groupId: z.cuid2(),
});

export const activityRouter = createTRPCRouter({
  getActivityById: protectedProcedure.input(z.cuid2()).query(({ input }) => {
    return db.query.activity.findFirst({
      where: eq(activity.id, input),
    });
  }),
  getActivityByName: publicProcedure.input(z.string()).query(({ input }) =>
    db.query.activity.findMany({
      where: ilike(activity.name, `%${input}%`),
      limit: 25,
      with: { group: true },
    })
  ),
  getActivityGroupById: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => {
      return db.query.activityGroup.findFirst({
        where: eq(activityGroup.id, input),
      });
    }),
  getActivityGroupsForUser: protectedProcedure
    .input(z.string())
    .query(({ input }) => {
      return db.query.activityGroup.findMany({
        where: or(
          eq(activityGroup.default, true),
          eq(activityGroup.coachId, input)
        ),
        with: { activities: true },
        orderBy: asc(activityGroup.name),
      });
    }),
  getAllActivityGroups: protectedProcedure.query(() => {
    return db.query.activityGroup.findMany({
      with: { coach: { with: { user: true } } },
      orderBy: asc(activityGroup.name),
    });
  }),
  getActivitiesForClub: protectedProcedure
    .input(z.object({ clubId: z.cuid2(), userId: z.cuid2() }))
    .query(({ ctx, input }) => {
      if (ctx.user.internalRole !== "ADMIN" && ctx.user.id !== input.userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to query activities from this club",
        });

      return db.query.club.findFirst({
        where: eq(club.id, input.clubId),
        with: { activities: true },
      });
    }),
  getAllActivitiesForGroup: protectedProcedure
    .input(z.cuid2())
    .query(({ ctx, input }) => {
      if (ctx.user.internalRole !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to query activities from this group",
        });

      return db.query.activity.findMany({
        where: eq(activity.groupId, input),
        with: { club: { columns: { name: true } } },
      });
    }),
  getAllClubsForGroup: protectedProcedure
    .input(z.cuid2())
    .query(({ ctx, input }) => {
      if (ctx.user.internalRole !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to query activities from this group",
        });

      return db.query.activity.findMany({
        where: eq(activity.groupId, input),
        with: { club: { columns: { name: true, id: true } } },
      });
    }),
  createActivity: protectedProcedure
    .input(activityObject.omit({ id: true }))
    .mutation(({ input }) => db.insert(activity).values(input)),
  updateActivity: protectedProcedure
    .input(activityObject.partial())
    .mutation(({ input }) =>
      db
        .update(activity)
        .set(input)
        .where(eq(activity.id, input.id ?? ""))
    ),
  deleteActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.cuid2(),
        clubId: z.cuid2(),
      })
    )
    .mutation(({ input }) =>
      db.delete(activity).where(eq(activity.id, input.activityId))
    ),
  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        userId: z.cuid2().optional().nullable(),
        default: z.boolean().optional().default(false),
      })
    )
    .mutation(({ input }) =>
      db.insert(activityGroup).values({
        name: input.name,
        coachId: input.userId,
        default: input.default,
      })
    ),
  updateGroup: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        name: z.string(),
        default: z.boolean().optional().default(false),
      })
    )
    .mutation(({ input }) =>
      db
        .update(activityGroup)
        .set({
          name: input.name,
          default: input.default,
        })
        .where(eq(activityGroup.id, input.id))
    ),
  deleteGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.cuid2(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const group = await db.query.activityGroup.findFirst({
        where: eq(activityGroup.id, input.groupId),
      });
      if (ctx.user.internalRole !== "ADMIN" && ctx.user.id !== group?.coachId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete this group",
        });

      return db
        .delete(activityGroup)
        .where(eq(activityGroup.id, input.groupId));
    }),
  affectToRoom: protectedProcedure
    .input(
      z.object({
        roomId: z.cuid2(),
        activityId: z.cuid2(),
      })
    )
    .mutation(({ input }) =>
      db.insert(roomActivities).values({
        roomId: input.roomId,
        activityId: input.activityId,
      })
    ),
  removeFromRoom: protectedProcedure
    .input(
      z.object({
        roomId: z.cuid2(),
        activityId: z.cuid2(),
      })
    )
    .mutation(({ input }) =>
      db
        .delete(roomActivities)
        .where(
          and(
            eq(roomActivities.roomId, input.roomId),
            eq(roomActivities.activityId, input.activityId)
          )
        )
    ),
});
