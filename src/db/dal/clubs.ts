import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { activity, club, clubCoachs, site } from "@/db/schema/club";
import { page } from "@/db/schema/page";
import { openingCalendar } from "@/db/schema/planning";
import { ActivityId, CalendarId, ClubId, UserId } from "../types";

// ==================== CLUB QUERIES ====================

export async function getClubById(clubId: ClubId, siteLimit?: number) {
  return db.query.club.findFirst({
    where: eq(club.id, clubId),
    with: {
      sites: {
        limit: siteLimit,
        with: {
          rooms: {
            with: {
              activities: {
                with: {
                  activity: true,
                },
              },
            },
          },
        },
      },
      activities: { with: { group: true } },
    },
  });
}

export async function getClubPagesForNav(clubId: ClubId) {
  return db.query.club.findFirst({
    where: eq(club.id, clubId),
    with: {
      pages: {
        where: eq(page.published, true),
        with: {
          sections: true,
        },
      },
    },
  });
}

export async function getClubsForManager(managerId: string, limit?: number) {
  return db.query.club.findMany({
    where: eq(club.managerId, managerId),
    orderBy: asc(club.name),
    limit,
  });
}

export async function getAllClubs() {
  return db.query.club.findMany({
    orderBy: asc(club.name),
    with: { activities: { with: { group: true } }, pages: true },
  });
}

export async function getClubForUpdate(clubId: ClubId) {
  return db.query.club.findFirst({
    where: eq(club.id, clubId),
    with: {
      manager: {
        with: {
          user: true,
        },
      },
    },
  });
}

// ==================== CLUB MUTATIONS ====================

export async function createClub(data: {
  name: string;
  address: string;
  managerId: string;
  logoUrl?: string;
}) {
  return db
    .insert(club)
    .values({
      name: data.name,
      address: data.address,
      managerId: data.managerId,
      logoUrl: data.logoUrl,
    })
    .returning();
}

export async function createSiteForClub(data: {
  clubId: ClubId;
  name: string;
  address: string;
  searchAddress: string;
  longitude: number;
  latitude: number;
}) {
  return db.insert(site).values({
    clubId: data.clubId,
    name: data.name,
    address: data.address,
    searchAddress: data.searchAddress,
    longitude: data.longitude,
    latitude: data.latitude,
  });
}

export async function updateClub(data: {
  id: ClubId;
  name: string;
  address: string;
  logoUrl: string | null;
  convexRoomId?: string;
}) {
  return db
    .update(club)
    .set({
      name: data.name,
      address: data.address,
      logoUrl: data.logoUrl,
      convexRoomId: data.convexRoomId,
    })
    .where(eq(club.id, data.id))
    .returning();
}

export async function updateClubConvexRoomId(
  clubId: ClubId,
  convexRoomId: string,
) {
  return db.update(club).set({ convexRoomId }).where(eq(club.id, clubId));
}

export async function updateClubCalendar(
  clubId: ClubId,
  calendarId: CalendarId,
) {
  return db
    .update(openingCalendar)
    .set({
      id: calendarId,
    })
    .where(eq(openingCalendar.clubId, clubId))
    .returning();
}

export async function deleteClub(clubId: ClubId) {
  return db.delete(club).where(eq(club.id, clubId));
}

// ==================== CLUB ACTIVITIES ====================

export async function updateClubActivities(
  clubId: ClubId,
  activityIds: ActivityId[],
) {
  return db
    .update(activity)
    .set({ clubId })
    .where(inArray(activity.id, activityIds))
    .returning();
}

// ==================== CLUB COACHES ====================

export async function getClubCoachRelation(
  clubId: ClubId,
  coachUserId: UserId,
) {
  return db.query.clubCoachs.findFirst({
    where: and(
      eq(clubCoachs.clubId, clubId),
      eq(clubCoachs.coachUserId, coachUserId),
    ),
  });
}

export async function addCoachToClub(clubId: ClubId, coachUserId: UserId) {
  return db
    .insert(clubCoachs)
    .values({
      coachUserId,
      clubId,
    })
    .returning();
}

// ==================== USER WITH PRICING (for feature checks) ====================

export async function getUserWithPricingFeatures(userId: UserId) {
  return db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      pricing: {
        with: {
          features: true,
        },
      },
    },
  });
}
