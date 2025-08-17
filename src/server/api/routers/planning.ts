import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { activity, club, room, site } from "@/db/schema/club";
import { dayNameEnum } from "@/db/schema/enums";
import { planning, planningActivity, reservation } from "@/db/schema/planning";
import { userCoach } from "@/db/schema/user";
import { getDayName } from "@/lib/dates/days";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { isCUID } from "@/lib/utils";
import { and, asc, eq, inArray, lte } from "drizzle-orm";
import z from "zod";

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
  day: (typeof dayNameEnum.enumValues)[number]
) {
  if (!isCUID(clubId)) return null;
  const clubPlanning = await db.query.planning.findFirst({
    where: and(
      eq(planning.clubId, clubId),
      lte(planning.startDate, new Date(Date.now()))
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

export const planningRouter = createTRPCRouter({
  getPlanningsForClub: protectedProcedure.input(z.string()).query(({ input }) =>
    db.query.planning.findMany({
      where: eq(planning.clubId, input),
      orderBy: asc(planning.startDate),
    })
  ),

  getPlanningById: protectedProcedure.input(z.cuid2()).query(({ input }) =>
    db.query.planning.findFirst({
      where: eq(planning.id, input),
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
    })
  ),
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
        .returning()
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
          }))
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
      db.insert(planningActivity).values(input).returning()
    ),
  updatePlanningActivity: protectedProcedure
    .input(planningActivityObject.partial())
    .mutation(({ input }) =>
      db
        .update(planningActivity)
        .set(input)
        .where(eq(planningActivity.id, input.id ?? ""))
        .returning()
    ),
  deletePlanningActivity: protectedProcedure
    .input(z.string())
    .mutation(({ input }) =>
      db.delete(planningActivity).where(eq(planningActivity.id, input))
    ),
  getClubDailyPlanning: publicProcedure
    .input(
      z.object({
        clubId: z.cuid2(),
        day: z.enum(dayNameEnum.enumValues),
      })
    )
    .query(({ input }) => getClubDailyPlanning(input.clubId, input.day)),
  getCoachDailyPlanning: protectedProcedure
    .input(
      z.object({
        coachId: z.cuid2(),
        day: z.enum(dayNameEnum.enumValues),
      })
    )
    .query(async ({ input }) => {
      const coachPlanning = await db.query.planning.findMany({
        where: and(
          eq(planning.clubId, input.coachId),
          lte(planning.startDate, new Date(Date.now())),
          eq(planningActivity.coachId, input.coachId)
        ),
        with: {
          club: true,
          planningActivities: {
            where: and(
              eq(planningActivity.day, input.day),
              eq(planningActivity.coachId, input.coachId)
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
    }),
  getCoachPlanningForClub: protectedProcedure
    .input(
      z.object({
        coachId: z.cuid2(),
        clubId: z.cuid2(),
      })
    )
    .query(async ({ input }) => {
      const coachPlanning = await db.query.planning.findFirst({
        where: and(
          eq(planning.clubId, input.clubId),
          lte(planning.startDate, new Date(Date.now()))
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
      })
    )
    .query(async ({ input }) => {
      const userData = await db.query.user.findFirst({
        where: eq(user.id, input.memberId),
        with: {
          memberData: {
            with: {
              clubs: true,
              // subscriptions: {
              //   with: {
              //     activityGroups: true,
              //     activities: true,
              //     rooms: true,
              //     sites: true,
              //   },
              // },
            },
          },
        },
      });

      const clubIds = Array.from(
        new Set(userData?.memberData?.clubs.map((c) => c.clubId))
      );

      const planningClubs = await db.query.planning.findMany({
        where: and(
          lte(planning.startDate, new Date(Date.now())),
          inArray(planning.clubId, clubIds)
        ),
        with: { club: true },
      });

      const planningData: (typeof planning & {
        club: typeof club;
        activities: (typeof planningActivity & {
          site: typeof site;
          room: typeof room | null;
          activity: typeof activity;
          coach: typeof userCoach | null;
          reservations: { id: string; date: Date }[];
        })[];
        withNoCalendar: (typeof activity & {
          rooms: {
            id: string;
            name: string;
            capacity: number;
            // reservation: typeof roomReservation;
          }[];
          reservations: { id: string; date: Date; roomName: string }[];
        })[];
      })[] = [];

      const dayName = getDayName(input.date);

      // for (const planningClub of planningClubs) {
      //   const sub = user?.memberData?.subscriptions.filter(
      //     (s) => s.clubId === planningClub.clubId
      //   );

      //   type TIn = { in: string[] };
      //   type TFilter = {
      //     activityId?: TIn;
      //     activity?: { groupId: TIn };
      //     siteId?: TIn;
      //     roomId?: TIn;
      //   };
      //   const where: {
      //     day: DayName;
      //     planningId: string;
      //     OR?: TFilter[];
      //   } = {
      //     day: dayName,
      //     planningId: planningClub.id,
      //   };
      //   type TFilterNC = {
      //     id?: TIn;
      //     groupId?: TIn;
      //   };

      //   const whereNoCal: {
      //     clubId: string;
      //     noCalendar: boolean;
      //     OR?: TFilterNC[];
      //   } = {
      //     clubId: planningClub.clubId,
      //     noCalendar: true,
      //   };

      //   for (const s of sub ?? []) {
      //     let fAct: TIn | null = null;
      //     let fGAct: TIn | null = null;
      //     let fSite: TIn | null = null;
      //     let fRoom: TIn | null = null;

      //     if (s.mode === "ACTIVITY_GROUP")
      //       fGAct = {
      //         in: s?.activitieGroups.map((ag) => ag.id),
      //       };
      //     if (s.mode === "ACTIVITY")
      //       fAct = {
      //         in: s.activities.map((a) => a.id),
      //       };
      //     if (s.restriction === "SITE") {
      //       const sites = s.sites.map((s) => s.id);
      //       fSite = { in: sites };
      //     }
      //     if (s.restriction === "ROOM") {
      //       const rooms = s.rooms.map((s) => s.id);
      //       fRoom = { in: rooms };
      //     }
      //     const filter: TFilter = {};
      //     if (fGAct) filter.activity = { groupId: fGAct };
      //     if (fAct) filter.activityId = fAct;
      //     if (fSite) filter.siteId = fSite;
      //     if (fRoom) filter.roomId = fRoom;
      //     if (Object.keys(filter).length) {
      //       if (!where.OR) where.OR = [];
      //       where.OR.push(filter);
      //     }
      //     const filterNC: TFilterNC = {};
      //     if (fGAct) filterNC.groupId = fGAct;
      //     if (fAct) filterNC.id = fAct;
      //     if (Object.keys(filterNC).length) {
      //       if (!whereNoCal.OR) whereNoCal.OR = [];
      //       whereNoCal.OR.push(filterNC);
      //     }
      //   }
      //   const pa = await db.query.planningActivity.findMany({
      //     where,
      //     with: {
      //       activity: true,
      //       coach: true,
      //       room: true,
      //       site: true,
      //       reservations: {
      //         where: {
      //           date: { gte: input.date },
      //         },
      //       },
      //     },
      //   });
      //   const withNoCalendar = await db.query.activity.findMany({
      //     where: whereNoCal,
      //     with: {
      //       // sites: { select: { name: true } },
      //       rooms: {
      //         select: {
      //           id: true,
      //           name: true,
      //           capacity: true,
      //           reservation: true,
      //         },
      //       },
      //       reservations: {
      //         where: {
      //           date: { gte: input.date },
      //         },
      //         with: {
      //           room: true,
      //         },
      //       },
      //     },
      //   });
      //   planning.push({
      //     ...planningClub,
      //     activities: pa.map((p) => ({
      //       ...p,
      //       reservations: p.reservations
      //         .filter((r) => isCUID(r.planningActivityId))
      //         .map((r) => ({ id: r.planningActivityId ?? "", date: r.date })),
      //     })),
      //     withNoCalendar: withNoCalendar.map((wnc) => ({
      //       ...wnc,
      //       rooms: wnc.rooms ?? [],
      //       reservations: wnc.reservations
      //         .filter((r) => isCUID(r.activityId))
      //         .map((r) => ({
      //           id: r.activityId ?? "",
      //           date: r.date,
      //           roomName: r.room?.name ?? "",
      //         })),
      //     })),
      //   });
      // }

      // TODO: manage exception days
      return planningData;
    }),
  createPlanningReservation: protectedProcedure
    .input(
      z.object({
        memberId: z.cuid2(),
        planningActivityId: z.cuid2(),
        date: z.date(),
      })
    )
    .mutation(({ input }) =>
      db
        .insert(reservation)
        .values({
          date: input.date,
          planningActivityId: input.planningActivityId,
          userId: input.memberId,
        })
        .returning()
    ),
  deleteReservation: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) =>
      db.delete(reservation).where(eq(reservation.id, input))
    ),
  createActivityReservation: protectedProcedure
    .input(
      z.object({
        memberId: z.cuid2(),
        activityId: z.cuid2(),
        date: z.date(),
        activitySlot: z.number(),
        roomId: z.cuid2(),
      })
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
        .returning()
    ),
});
