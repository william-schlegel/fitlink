import { and, asc, count, eq, gte, ilike, SQL } from "drizzle-orm";

import { userCoach, userManager, userMember } from "@/db/schema/user";
import { pricing } from "@/db/schema/subscription";
import { reservation } from "@/db/schema/planning";
import { roleEnum } from "@/db/schema/enums";
import { user } from "@/db/schema/auth";
import { db, TxClient } from "@/db";

// ==================== USER QUERIES ====================

export async function getUserById(id: string) {
  return db.query.user.findFirst({
    where: eq(user.id, id),
    with: {
      accounts: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return db.query.user.findFirst({
    where: eq(user.email, email),
  });
}

export async function getUserWithPricing(id: string) {
  return db.query.user.findFirst({
    where: eq(user.id, id),
    with: {
      pricing: {
        with: {
          features: true,
        },
      },
    },
  });
}

export async function getUserFullById(id: string) {
  return db.query.user.findFirst({
    where: eq(user.id, id),
    with: {
      pricing: true,
      paiements: true,
      managerData: {
        with: {
          managedClubs: {
            columns: {
              id: true,
            },
            with: {
              sites: { columns: { id: true } },
              activities: { columns: { id: true } },
              subscriptions: { columns: { id: true } },
            },
          },
        },
      },
      coachData: {
        with: {
          certifications: true,
          page: true,
        },
      },
    },
  });
}

export async function getUserAvatar(userId: string) {
  const u = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });
  return { name: u?.name ?? "", imageUrl: u?.image ?? "/images/dummy.jpg" };
}

export type UserFilter = {
  name?: string;
  email?: string;
  internalRole?: (typeof roleEnum.enumValues)[number];
  dueDate?: Date;
  dateOperation?: "gt" | "lt";
};

export async function getAllUsers(input: {
  filter: UserFilter;
  skip: number;
  take: number;
}) {
  const filter: SQL[] = [];
  if (input.filter?.name)
    filter.push(ilike(user.name, `%${input.filter.name}%`));
  if (input.filter?.email)
    filter.push(ilike(user.email, `%${input.filter.email}%`));
  if (input.filter?.internalRole)
    filter.push(eq(user.internalRole, input.filter.internalRole));
  if (input.filter?.dueDate)
    filter.push(eq(user.cancelationDate, input.filter.dueDate));

  return db.transaction(async (tx) => {
    const userCount = await tx
      .select({ count: count() })
      .from(user)
      .where(and(...filter));
    const users = await tx
      .select()
      .from(user)
      .where(and(...filter))
      .limit(input.take)
      .offset(input.skip);
    return { userCount: userCount[0].count, users };
  });
}

export async function searchUsers(query: string, limit: number = 20) {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(user)
    .where(ilike(user.name, `%${query}%`))
    .limit(limit);
}

// ==================== USER MUTATIONS ====================

export async function updateUser(
  data: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    internalRole?: (typeof roleEnum.enumValues)[number];
    pricingId?: string;
    monthlyPayment?: boolean;
    cancelationDate?: Date;
    image?: string;
  },
  tx?: TxClient,
) {
  const client = tx ?? db;
  return client
    .update(user)
    .set({
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      internalRole: data.internalRole,
      pricingId: data.pricingId,
      monthlyPayment: data.monthlyPayment,
      cancelationDate: data.cancelationDate,
      image: data.image,
    })
    .where(eq(user.id, data.id))
    .returning();
}

export async function deleteUser(userId: string) {
  return db.delete(user).where(eq(user.id, userId));
}

export async function updatePaymentPeriod(
  userId: string,
  monthlyPayment: boolean,
) {
  return db.update(user).set({ monthlyPayment }).where(eq(user.id, userId));
}

// ==================== USER SUBSCRIPTIONS ====================

export async function getUserSubscriptionsById(userId: string) {
  return db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      memberData: {
        with: {
          subscriptions: {
            with: {
              subscription: {
                with: {
                  activitieGroups: { with: { activityGroup: true } },
                  activities: { with: { activity: true } },
                  sites: { with: { site: true } },
                  rooms: { with: { room: true } },
                  club: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

// ==================== USER RESERVATIONS ====================

export async function getReservationsByUserId(userId: string, after: Date) {
  return db.query.reservation.findMany({
    where: and(eq(reservation.userId, userId), gte(reservation.date, after)),
    orderBy: [asc(reservation.date)],
    with: {
      room: true,
      activity: true,
      planningActivity: {
        with: {
          activity: true,
          coach: true,
          room: true,
        },
      },
    },
  });
}

// ==================== PRICING DATA ====================

export async function getPricingData(pricingId: string) {
  return db.query.pricing.findFirst({
    where: eq(pricing.id, pricingId),
    with: {
      features: true,
    },
  });
}

// ==================== COACH DATA FOR USER ====================

export async function getOrCreateCoachData(userId: string, tx?: TxClient) {
  const client = tx ?? db;
  let coachData = await client.query.userCoach.findFirst({
    where: eq(userCoach.userId, userId),
  });
  if (!coachData) {
    const newCoach = await client
      .insert(userCoach)
      .values({ userId })
      .returning();
    coachData = newCoach[0];
  }
  return coachData;
}

export async function updateCoachData(
  data: {
    id: string;
    userId: string;
    longitude?: number;
    latitude?: number;
    searchAddress?: string;
    range?: number;
    publicName?: string;
    aboutMe?: string;
    description?: string;
    coachingActivities?: string[];
    convexRoomId?: string;
  },
  tx?: TxClient,
) {
  const client = tx ?? db;
  return client
    .update(userCoach)
    .set({
      userId: data.userId,
      longitude: data.longitude,
      latitude: data.latitude,
      searchAddress: data.searchAddress,
      range: data.range,
      publicName: data.publicName,
      aboutMe: data.aboutMe,
      description: data.description,
      coachingActivities: data.coachingActivities,
      convexRoomId: data.convexRoomId,
    })
    .where(eq(userCoach.id, data.id))
    .returning();
}

// ==================== MEMBER DATA ====================

export async function getMemberData(memberId: string) {
  const md = await db.query.userMember.findFirst({
    where: eq(userMember.userId, memberId),
    with: {
      subscriptions: {
        with: {
          subscription: {
            with: {
              activitieGroups: { with: { activityGroup: true } },
              activities: { with: { activity: true } },
              sites: { with: { site: true } },
              rooms: { with: { room: true } },
              club: true,
            },
          },
        },
      },
      clubs: true,
    },
  });
  const cd = await db.query.userCoach.findFirst({
    where: eq(userCoach.userId, memberId),
    with: {
      coachingPrices: true,
      certifications: true,
      activityGroups: true,
      page: true,
      clubs: true,
    },
  });
  const mnd = await db.query.userManager.findFirst({
    where: eq(userManager.userId, memberId),
    with: {
      managedClubs: true,
    },
  });
  return {
    memberData: md,
    coachData: cd,
    managerData: mnd,
  };
}

export type CoachDataOfferType = NonNullable<
  Awaited<ReturnType<typeof getMemberData>>["coachData"]
>["coachingPrices"][number];

export type MemberSubscriptionType = NonNullable<
  Awaited<ReturnType<typeof getMemberData>>["memberData"]
>["subscriptions"][number]["subscription"];
