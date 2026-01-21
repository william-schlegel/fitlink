import { asc, eq, gte } from "drizzle-orm";

import { startOfToday } from "date-fns";

import { club, event } from "@/db/schema/club";
import { user } from "@/db/schema/auth";
import { db } from "@/db";

// ==================== ADMIN DASHBOARD ====================

export async function getAdminData() {
  const clubs = await db.query.club.findMany({
    with: {
      sites: {
        columns: { id: true },
        with: { rooms: { columns: { id: true } } },
      },
    },
  });
  const members = await db.query.user.findMany();
  return {
    clubs,
    members,
  };
}

// ==================== MANAGER DASHBOARD ====================

export async function getManagerDataForUserId(userId: string) {
  const clubData = await db.query.club.findMany({
    where: eq(club.managerId, userId),
    with: {
      sites: {
        columns: { name: true },
        with: {
          rooms: {
            columns: {
              name: true,
            },
          },
        },
      },
      activities: {
        columns: { name: true },
      },
      subscriptions: {
        columns: {
          name: true,
        },
        with: {
          users: {
            columns: {
              userId: true,
            },
          },
        },
      },
      events: {
        where: gte(event.startDate, startOfToday()),
        orderBy: asc(event.startDate),
      },
    },
  });

  return clubData;
}

// ==================== COACH DASHBOARD ====================

export async function getCoachDataForUserId(userId: string) {
  return db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      coachData: {
        with: {
          clubs: {
            with: {
              club: true,
            },
          },
          certifications: true,
          activityGroups: true,
          page: true,
          coachingPrices: true,
        },
      },
    },
  });
}
