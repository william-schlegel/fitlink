import { and, desc, eq, lte } from "drizzle-orm";
import { z } from "zod";

import {
  dayOpeningTime,
  openingCalendar,
  openingCalendarClubs,
  openingCalendarRooms,
  openingCalendarSites,
} from "@/db/schema/planning";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";
import { dayNameEnum } from "@/db/schema/enums";
import { room, site } from "@/db/schema/club";
import { db } from "@/db";

const CalendarData = {
  startDate: z.date().default(new Date()),
  openingTime: z
    .array(
      z.object({
        name: z.enum(dayNameEnum.enumValues),
        workingHours: z.array(
          z.object({
            opening: z
              .string()
              .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
              .default("00:00"),
            closing: z
              .string()
              .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
              .default("23:59"),
          }),
        ),
        wholeDay: z.boolean().default(true),
        closed: z.boolean().default(false),
      }),
    )
    .length(7),
};

export const calendarRouter = createTRPCRouter({
  getCalendarById: protectedProcedure.input(z.cuid2()).query(({ input }) => {
    return db.query.openingCalendar.findFirst({
      where: eq(openingCalendar.id, input),
      with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
    });
  }),
  getCalendarForClub: protectedProcedure.input(z.cuid2()).query(({ input }) => {
    const now = new Date();
    const dtNow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    return db.query.openingCalendar.findFirst({
      where: and(
        eq(openingCalendar.id, input),
        lte(openingCalendar.startDate, dtNow),
      ),
      orderBy: desc(openingCalendar.startDate),
      with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
    });
  }),
  getCalendarForSite: protectedProcedure
    .input(
      z.object({
        siteId: z.cuid2(),
        clubId: z.cuid2(),
        openWithClub: z.boolean().default(false),
      }),
    )
    .query(async ({ input }) => {
      const now = new Date();
      const dtNow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
      const siteCal = await db.query.openingCalendar.findFirst({
        where: and(
          eq(openingCalendar.id, input.siteId),
          lte(openingCalendar.startDate, dtNow),
        ),
        orderBy: desc(openingCalendar.startDate),
        with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
      });
      if (!siteCal) {
        const siteData = await db.query.site.findFirst({
          where: eq(site.id, input.siteId),
          with: { openingCalendars: true },
        });

        if (siteData?.openWithClub) {
          return db.query.openingCalendar.findFirst({
            where: and(
              eq(openingCalendar.id, input.clubId),
              lte(openingCalendar.startDate, dtNow),
            ),
            orderBy: desc(openingCalendar.startDate),
            with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
          });
        }
      }
      return siteCal;
    }),
  getCalendarForRoom: protectedProcedure
    .input(
      z.object({
        roomId: z.cuid2(),
        siteId: z.cuid2(),
        clubId: z.cuid2(),
      }),
    )
    .query(async ({ input }) => {
      const now = new Date();
      const dtNow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
      const roomCal = await db.query.openingCalendar.findFirst({
        where: and(
          eq(openingCalendar.id, input.roomId),
          lte(openingCalendar.startDate, dtNow),
        ),
        orderBy: desc(openingCalendar.startDate),
        with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
      });
      if (!roomCal) {
        const roomData = await db.query.room.findFirst({
          where: eq(room.id, input.roomId),
        });
        if (roomData?.openWithSite) {
          const siteCal = await db.query.openingCalendar.findFirst({
            where: and(
              eq(openingCalendar.id, input.siteId),
              lte(openingCalendar.startDate, dtNow),
            ),
            orderBy: desc(openingCalendar.startDate),
            with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
          });
          if (!siteCal) {
            const siteData = await db.query.site.findFirst({
              where: eq(site.id, input.siteId),
              with: { openingCalendars: true },
            });
            if (siteData?.openWithClub) {
              const clubCal = await db.query.openingCalendar.findFirst({
                where: and(
                  eq(openingCalendar.id, input.clubId),
                  lte(openingCalendar.startDate, dtNow),
                ),

                orderBy: desc(openingCalendar.startDate),
                with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
              });
              return clubCal;
            }
          }
          return siteCal;
        } else if (roomData?.openWithClub) {
          const clubCal = await db.query.openingCalendar.findFirst({
            where: and(
              eq(openingCalendar.id, input.clubId),
              lte(openingCalendar.startDate, dtNow),
            ),
            orderBy: desc(openingCalendar.startDate),
            with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
          });
          return clubCal;
        }
      }

      return roomCal;
    }),
  createCalendar: protectedProcedure
    .input(
      z.object({
        calendar: z.object(CalendarData),
        siteId: z.cuid2().optional(),
        roomId: z.cuid2().optional(),
        clubId: z.cuid2().optional(),
      }),
    )
    .mutation(({ input }) => {
      const createOT = input.calendar.openingTime.map((i) => ({
        name: i.name,
        wholeDay: i.wholeDay,
        closed: i.closed,
        workingHours: {
          create: i.workingHours.map((w) => ({
            opening: w.opening,
            closing: w.closing,
          })),
        },
      }));
      return db.transaction(async (tx) => {
        const calendar = await tx
          .insert(openingCalendar)
          .values({
            startDate: input.calendar.startDate,
          })
          .returning();
        const calendarId = calendar[0].id;
        await tx.insert(dayOpeningTime).values(createOT);
        if (input.siteId) {
          await tx.insert(openingCalendarSites).values({
            siteId: input.siteId,
            openingCalendarId: calendarId,
          });
        }
        if (input.roomId) {
          await tx.insert(openingCalendarRooms).values({
            roomId: input.roomId,
            openingCalendarId: calendarId,
          });
        }
        if (input.clubId) {
          await tx.insert(openingCalendarClubs).values({
            clubId: input.clubId,
            openingCalendarId: calendarId,
          });
        }
        return calendar;
      });
    }),
});
