import { z } from "zod";

import {
  getCalendarById,
  getCalendarForClub,
  getCalendarForSite,
  getCalendarForRoom,
  createCalendar,
} from "@/db/dal";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";
import { dayNameEnum } from "@/db/schema/enums";

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
  getCalendarById: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => getCalendarById(input)),

  getCalendarForClub: protectedProcedure
    .input(z.cuid2())
    .query(async ({ input }) => {
      const calendarForClub = await getCalendarForClub(input);
      return calendarForClub ?? null;
    }),

  getCalendarForSite: protectedProcedure
    .input(
      z.object({
        siteId: z.cuid2(),
        clubId: z.cuid2(),
        openWithClub: z.boolean().default(false),
      }),
    )
    .query(({ input }) => getCalendarForSite(input.siteId, input.clubId)),

  getCalendarForRoom: protectedProcedure
    .input(
      z.object({
        roomId: z.cuid2(),
        siteId: z.cuid2(),
        clubId: z.cuid2(),
      }),
    )
    .query(({ input }) =>
      getCalendarForRoom(input.roomId, input.siteId, input.clubId),
    ),

  createCalendar: protectedProcedure
    .input(
      z.object({
        calendar: z.object(CalendarData),
        siteId: z.cuid2().optional(),
        roomId: z.cuid2().optional(),
        clubId: z.cuid2().optional(),
      }),
    )
    .mutation(({ input }) =>
      createCalendar({
        startDate: input.calendar.startDate,
        openingTime: input.calendar.openingTime,
        siteId: input.siteId,
        roomId: input.roomId,
        clubId: input.clubId,
      }),
    ),
});
