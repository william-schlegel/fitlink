import { and, desc, eq, lte } from "drizzle-orm";

import { endOfDay } from "date-fns";

import { db } from "@/db";
import { room, site } from "@/db/schema/club";
import { dayNameEnum } from "@/db/schema/enums";
import { openingCalendar } from "@/db/schema/planning";
import {
  CalendarData,
  CreateCalendarInput,
  UpdateCalendarInput,
} from "@/schemas/planning";
import { CalendarId, ClubId, RoomId, SiteId } from "../types";

// ==================== CALENDAR QUERIES ====================

function convertOpeningCalendarToCalendarOutput(
  calendar: typeof openingCalendar.$inferSelect,
): CalendarData {
  return {
    id: calendar.id,
    startDate: calendar.startDate,
    clubId: calendar.clubId,
    siteId: calendar.siteId,
    roomId: calendar.roomId,
    openingTimes: calendar.openingTimes ?? [],
  };
}

export async function getCalendarById(
  id: CalendarId,
): Promise<CalendarData | null> {
  const calendar = await db.query.openingCalendar.findFirst({
    where: eq(openingCalendar.id, id),
  });
  if (!calendar) {
    return null;
  }
  return convertOpeningCalendarToCalendarOutput(calendar);
}

export async function getCalendarForClub(
  clubId: ClubId,
): Promise<CalendarData | null> {
  const now = endOfDay(new Date());
  const calendar = await db.query.openingCalendar.findFirst({
    where: and(
      eq(openingCalendar.clubId, clubId),
      lte(openingCalendar.startDate, now),
    ),
    orderBy: desc(openingCalendar.startDate),
  });
  if (!calendar) return null;

  return convertOpeningCalendarToCalendarOutput(calendar);
}

export async function getCalendarForSite(
  siteId: SiteId,
  clubId: ClubId,
): Promise<CalendarData | null> {
  const now = endOfDay(new Date());
  const siteCal = await db.query.openingCalendar.findFirst({
    where: and(
      eq(openingCalendar.siteId, siteId),
      lte(openingCalendar.startDate, now),
    ),
    orderBy: desc(openingCalendar.startDate),
  });

  if (!siteCal) {
    const siteData = await db.query.site.findFirst({
      where: eq(site.id, siteId),
    });

    if (siteData?.openWithClub) {
      const clubCal = await db.query.openingCalendar.findFirst({
        where: and(
          eq(openingCalendar.clubId, clubId),
          lte(openingCalendar.startDate, now),
        ),
        orderBy: desc(openingCalendar.startDate),
      });
      if (!clubCal) return null;

      return convertOpeningCalendarToCalendarOutput(clubCal);
    }
    return null;
  }

  return convertOpeningCalendarToCalendarOutput(siteCal);
}

export async function getCalendarForRoom(
  roomId: RoomId,
  siteId: SiteId,
  clubId: ClubId,
): Promise<CalendarData | null> {
  const now = endOfDay(new Date());
  const roomCal = await db.query.openingCalendar.findFirst({
    where: and(
      eq(openingCalendar.roomId, roomId),
      lte(openingCalendar.startDate, now),
    ),
    orderBy: desc(openingCalendar.startDate),
  });

  if (!roomCal) {
    const roomData = await db.query.room.findFirst({
      where: eq(room.id, roomId),
    });

    if (roomData?.openWithSite) {
      const siteCal = await db.query.openingCalendar.findFirst({
        where: and(
          eq(openingCalendar.siteId, siteId),
          lte(openingCalendar.startDate, now),
        ),
        orderBy: desc(openingCalendar.startDate),
      });

      if (!siteCal) {
        const siteData = await db.query.site.findFirst({
          where: eq(site.id, siteId),
        });

        if (siteData?.openWithClub) {
          const clubCal = await db.query.openingCalendar.findFirst({
            where: and(
              eq(openingCalendar.clubId, clubId),
              lte(openingCalendar.startDate, now),
            ),
            orderBy: desc(openingCalendar.startDate),
          });
          if (!clubCal) return null;
          return convertOpeningCalendarToCalendarOutput(clubCal);
        }
      }
      if (!siteCal) return null;
      return convertOpeningCalendarToCalendarOutput(siteCal);
    } else if (roomData?.openWithClub) {
      const clubCal = await db.query.openingCalendar.findFirst({
        where: and(
          eq(openingCalendar.clubId, clubId),
          lte(openingCalendar.startDate, now),
        ),
        orderBy: desc(openingCalendar.startDate),
      });
      if (!clubCal) return null;
      return convertOpeningCalendarToCalendarOutput(clubCal);
    }
  }

  if (!roomCal) return null;
  return convertOpeningCalendarToCalendarOutput(roomCal);
}

// ==================== CALENDAR MUTATIONS ====================

export type OpeningTimeInput = {
  name: (typeof dayNameEnum.enumValues)[number];
  wholeDay: boolean;
  closed: boolean;
  workingHours: Array<{
    opening: string;
    closing: string;
  }>;
};

export async function createCalendar(data: CreateCalendarInput) {
  const calendar = await db.insert(openingCalendar).values(data).returning();
  return calendar[0];
}

export async function updateCalendar(data: UpdateCalendarInput) {
  const calendar = await db
    .update(openingCalendar)
    .set(data)
    .where(eq(openingCalendar.id, data.id))
    .returning();
  return calendar[0];
}
