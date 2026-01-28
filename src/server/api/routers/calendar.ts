import { z } from "zod";

import {
  createCalendar,
  getCalendarById,
  getCalendarForClub,
  getCalendarForRoom,
  getCalendarForSite,
  updateCalendar,
} from "@/db/dal";
import { dayNameEnum } from "@/db/schema/enums";
import { ZodCalendarId, ZodClubId, ZodRoomId, ZodSiteId } from "@/db/types";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";

const CalendarData = {
  startDate: z.date().default(new Date()),
  openingTimes: z
    .array(
      z.object({
        day: z.enum(dayNameEnum.enumValues),
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
    .input(ZodCalendarId)
    .query(({ input }) => getCalendarById(input)),

  getCalendarForClub: protectedProcedure
    .input(ZodClubId)
    .query(async ({ input }) => {
      const calendarForClub = await getCalendarForClub(input);
      return calendarForClub ?? null;
    }),

  getCalendarForSite: protectedProcedure
    .input(
      z.object({
        siteId: ZodSiteId,
        clubId: ZodClubId,
        openWithClub: z.boolean().default(false),
      }),
    )
    .query(({ input }) => getCalendarForSite(input.siteId, input.clubId)),

  getCalendarForRoom: protectedProcedure
    .input(
      z.object({
        roomId: ZodRoomId,
        siteId: ZodSiteId,
        clubId: ZodClubId,
      }),
    )
    .query(({ input }) =>
      getCalendarForRoom(input.roomId, input.siteId, input.clubId),
    ),

  createCalendar: protectedProcedure
    .input(
      z.object({
        calendar: z.object(CalendarData),
        siteId: ZodSiteId.optional(),
        roomId: ZodRoomId.optional(),
        clubId: ZodClubId,
      }),
    )
    .mutation(({ input }) =>
      createCalendar({
        startDate: input.calendar.startDate,
        openingTimes: input.calendar.openingTimes,
        siteId: input.siteId ?? null,
        roomId: input.roomId ?? null,
        clubId: input.clubId,
      }),
    ),
  updateCalendar: protectedProcedure
    .input(
      z.object({
        calendar: z.object(CalendarData),
        clubId: ZodClubId,
        siteId: ZodSiteId.optional(),
        roomId: ZodRoomId.optional(),
        calendarId: ZodCalendarId,
      }),
    )
    .mutation(({ input }) =>
      updateCalendar({
        id: input.calendarId,
        clubId: input.clubId,
        siteId: input.siteId ?? null,
        roomId: input.roomId ?? null,
        startDate: input.calendar.startDate,
        openingTimes: input.calendar.openingTimes,
      }),
    ),
});
