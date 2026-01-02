import { and, desc, eq, lte } from "drizzle-orm";

import { endOfDay } from "date-fns";

import {
  dayOpeningTime,
  openingCalendar,
  openingCalendarClubs,
  openingCalendarRooms,
  openingCalendarSites,
} from "@/db/schema/planning";
import { dayNameEnum } from "@/db/schema/enums";
import { room, site } from "@/db/schema/club";
import { db } from "@/db";

// ==================== CALENDAR QUERIES ====================

export async function getCalendarById(id: string) {
  return db.query.openingCalendar.findFirst({
    where: eq(openingCalendar.id, id),
    with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
  });
}

export async function getCalendarForClub(clubId: string) {
  const now = endOfDay(new Date());
  return db.query.openingCalendar.findFirst({
    where: and(
      eq(openingCalendar.id, clubId),
      lte(openingCalendar.startDate, now),
    ),
    orderBy: desc(openingCalendar.startDate),
    with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
  });
}

export async function getCalendarForSite(siteId: string, clubId: string) {
  const now = endOfDay(new Date());
  const siteCal = await db.query.openingCalendar.findFirst({
    where: and(
      eq(openingCalendar.id, siteId),
      lte(openingCalendar.startDate, now),
    ),
    orderBy: desc(openingCalendar.startDate),
    with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
  });

  if (!siteCal) {
    const siteData = await db.query.site.findFirst({
      where: eq(site.id, siteId),
      with: { openingCalendars: true },
    });

    if (siteData?.openWithClub) {
      return db.query.openingCalendar.findFirst({
        where: and(
          eq(openingCalendar.id, clubId),
          lte(openingCalendar.startDate, now),
        ),
        orderBy: desc(openingCalendar.startDate),
        with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
      });
    }
  }

  return siteCal;
}

export async function getCalendarForRoom(
  roomId: string,
  siteId: string,
  clubId: string,
) {
  const now = endOfDay(new Date());
  const roomCal = await db.query.openingCalendar.findFirst({
    where: and(
      eq(openingCalendar.id, roomId),
      lte(openingCalendar.startDate, now),
    ),
    orderBy: desc(openingCalendar.startDate),
    with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
  });

  if (!roomCal) {
    const roomData = await db.query.room.findFirst({
      where: eq(room.id, roomId),
    });

    if (roomData?.openWithSite) {
      const siteCal = await db.query.openingCalendar.findFirst({
        where: and(
          eq(openingCalendar.id, siteId),
          lte(openingCalendar.startDate, now),
        ),
        orderBy: desc(openingCalendar.startDate),
        with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
      });

      if (!siteCal) {
        const siteData = await db.query.site.findFirst({
          where: eq(site.id, siteId),
          with: { openingCalendars: true },
        });

        if (siteData?.openWithClub) {
          return db.query.openingCalendar.findFirst({
            where: and(
              eq(openingCalendar.id, clubId),
              lte(openingCalendar.startDate, now),
            ),
            orderBy: desc(openingCalendar.startDate),
            with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
          });
        }
      }
      return siteCal;
    } else if (roomData?.openWithClub) {
      return db.query.openingCalendar.findFirst({
        where: and(
          eq(openingCalendar.id, clubId),
          lte(openingCalendar.startDate, now),
        ),
        orderBy: desc(openingCalendar.startDate),
        with: { dayOpeningTimes: { with: { dayOpeningTime: true } } },
      });
    }
  }

  return roomCal;
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

export async function createCalendar(data: {
  startDate: Date;
  openingTime: OpeningTimeInput[];
  siteId?: string;
  roomId?: string;
  clubId?: string;
}) {
  return db.transaction(async (tx) => {
    const calendar = await tx
      .insert(openingCalendar)
      .values({
        startDate: data.startDate,
      })
      .returning();

    const calendarId = calendar[0].id;

    const createOT = data.openingTime.map((i) => ({
      name: i.name,
      wholeDay: i.wholeDay,
      closed: i.closed,
    }));

    await tx.insert(dayOpeningTime).values(createOT);

    if (data.siteId) {
      await tx.insert(openingCalendarSites).values({
        siteId: data.siteId,
        openingCalendarId: calendarId,
      });
    }

    if (data.roomId) {
      await tx.insert(openingCalendarRooms).values({
        roomId: data.roomId,
        openingCalendarId: calendarId,
      });
    }

    if (data.clubId) {
      await tx.insert(openingCalendarClubs).values({
        clubId: data.clubId,
        openingCalendarId: calendarId,
      });
    }

    return calendar;
  });
}

