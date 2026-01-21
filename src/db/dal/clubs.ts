import { and, asc, eq, inArray } from "drizzle-orm";

import { activity, club, clubCoachs, site } from "@/db/schema/club";
import { openingCalendarClubs } from "@/db/schema/planning";
import { page } from "@/db/schema/page";
import { user } from "@/db/schema/auth";
import { db } from "@/db";

// ==================== CLUB QUERIES ====================

export async function getClubById(clubId: string, siteLimit?: number) {
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

export async function getClubPagesForNav(clubId: string) {
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

export async function getClubForUpdate(clubId: string) {
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
  clubId: string;
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
  id: string;
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
  clubId: string,
  convexRoomId: string,
) {
  return db.update(club).set({ convexRoomId }).where(eq(club.id, clubId));
}

export async function updateClubCalendar(clubId: string, calendarId: string) {
  return db
    .update(openingCalendarClubs)
    .set({
      openingCalendarId: calendarId,
      clubId,
    })
    .where(eq(openingCalendarClubs.clubId, clubId))
    .returning();
}

export async function deleteClub(clubId: string) {
  return db.delete(club).where(eq(club.id, clubId));
}

// ==================== CLUB ACTIVITIES ====================

export async function updateClubActivities(
  clubId: string,
  activityIds: string[],
) {
  return db
    .update(activity)
    .set({ clubId })
    .where(inArray(activity.id, activityIds))
    .returning();
}

// ==================== CLUB COACHES ====================

export async function getClubCoachRelation(
  clubId: string,
  coachUserId: string,
) {
  return db.query.clubCoachs.findFirst({
    where: and(
      eq(clubCoachs.clubId, clubId),
      eq(clubCoachs.coachUserId, coachUserId),
    ),
  });
}

export async function addCoachToClub(clubId: string, coachUserId: string) {
  return db
    .insert(clubCoachs)
    .values({
      coachUserId,
      clubId,
    })
    .returning();
}

// ==================== USER WITH PRICING (for feature checks) ====================

export async function getUserWithPricingFeatures(userId: string) {
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
