import { and, asc, count, eq, gte, ilike, SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  addMemberToClubRoomInConvex,
  createCoachRoomInConvex,
  createNotificationInConvex,
} from "@/lib/convex/server";
import {
  userCoach,
  userManager,
  userMember,
  userMemberToSubscription,
} from "@/db/schema/user";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { pricing, subscription } from "@/db/schema/subscription";
import { TUserFilter } from "@/app/admin/users/userFilter";
import { featureEnum, roleEnum } from "@/db/schema/enums";
import { reservation } from "@/db/schema/planning";
import { isAdmin } from "@/server/lib/userTools";
import { auth } from "@/lib/auth/server";
import { user } from "@/db/schema/auth";
import { db } from "@/db";

const UserFilter = z
  .object({
    name: z.string(),
    email: z.string(),
    internalRole: z.enum(roleEnum.enumValues),
    dueDate: z.date(),
    dateOperation: z.enum(["gt", "lt"]),
  })
  .partial();

export type GetUserByIdOptions = {
  withImage?: boolean;
  withMemberData?: boolean;
  withFeatures?: boolean;
  withPricing?: boolean;
};

async function getMemberData(memberId: string) {
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
      coachingActivities: true,
      coachingPrices: true,
      certifications: true,
      activityGroups: true,
      page: true,
      clubs: true,
    },
  });
  const mnd = db.query.userManager.findFirst({
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

async function getPricingData(pricingId: string) {
  return await db.query.pricing.findFirst({
    where: eq(pricing.id, pricingId!),
    with: {
      features: true,
    },
  });
}

export async function getAllUsers(input: {
  filter: TUserFilter;
  skip: number;
  take: number;
}) {
  await isAdmin(true);
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

export async function getUserFullById(id: string) {
  await isAdmin(true);
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
          // clubs: true,
        },
      },
    },
  });
}

export const userRouter = createTRPCRouter({
  getUserById: publicProcedure
    .input(
      z.object({
        id: z.string(),
        options: z
          .object({
            withImage: z.boolean().optional().default(true),
            withMemberData: z.boolean().optional().default(false),
            withFeatures: z.boolean().optional().default(false),
            withPricing: z.boolean().optional().default(false),
          })
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const u = await db.query.user.findFirst({
        where: eq(user.id, input.id),
        with: {
          accounts: true,
        },
      });
      if (!u) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      const profileImageUrl: string = u?.image ?? "/images/dummy.jpg";

      let extraData: Awaited<ReturnType<typeof getMemberData>> | null = null;

      if (input.options?.withMemberData) extraData = await getMemberData(u.id);

      let pricingData: Awaited<ReturnType<typeof getPricingData>> | null = null;

      if (input.options?.withPricing)
        pricingData = await getPricingData(u.pricingId!);

      let features: (typeof featureEnum.enumValues)[number][] = [];
      if (input.options?.withFeatures) {
        const featuresData = await db.query.pricing.findFirst({
          where: eq(pricing.id, u.pricingId!),
          with: {
            features: true,
          },
        });
        features = featuresData?.features.map((f) => f.feature) ?? [];
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        internalRole: u.internalRole,
        profileImageId: u.profileImageId,
        profileImageUrl,
        pricingId: u.pricingId,
        trialUntil: u.trialUntil,
        monthlyPayment: u.monthlyPayment,
        accounts: u.accounts.map((a) => ({
          id: a.id,
          provider: a.providerId,
        })),

        memberData: extraData?.memberData ?? null,
        coachData: extraData?.coachData ?? null,
        managerData: extraData?.managerData ?? null,
        pricing: pricingData,
        features,
      };

      // // TODO: add chat token
      // // if (u?.id && !u?.chatToken) {
      // //   const token = createToken(user.id);
      // //   user.chatToken = token;
      // //   await ctx.prisma.user.update({
      // //     where: { id: input },
      // //     data: { chatToken: token },
      // //   });
      // // }
    }),
  getUserSubscriptionsById: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const u = await db.query.user.findFirst({
        where: eq(user.id, input),
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
      return (
        u?.memberData?.subscriptions?.map(({ subscription: s }) => ({
          ...s,
          activitieGroups: s.activitieGroups.map((j) => j.activityGroup),
          activities: s.activities.map((j) => j.activity),
          sites: s.sites.map((j) => j.site),
          rooms: s.rooms.map((j) => j.room),
        })) ?? []
      );
    }),
  getReservationsByUserId: protectedProcedure
    .input(z.object({ userId: z.string(), after: z.date() }))
    .query(({ input }) => {
      return db.query.reservation.findMany({
        where: and(
          eq(reservation.userId, input.userId),
          gte(reservation.date, input.after),
        ),
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
    }),
  getUserFullById: protectedProcedure
    .input(z.string())
    .query(({ input }) => getUserFullById(input)),
  getAllUsers: protectedProcedure
    .input(
      z.object({
        filter: UserFilter,
        skip: z.number(),
        take: z.number(),
      }),
    )
    .query(({ input }) => getAllUsers(input)),
  searchUsers: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      const users = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(user)
        .where(ilike(user.name, `%${input.query}%`))
        .limit(input.limit);

      return users;
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        internalRole: z.enum(roleEnum.enumValues),
        pricingId: z.cuid2().optional(),
        monthlyPayment: z.boolean().optional(),
        cancelationDate: z.date().optional(),
        // profileImageId: z.string().optional(),
        profileImageUrl: z.string().optional(),
        // coach data
        longitude: z.number().optional(),
        latitude: z.number().optional(),
        searchAddress: z.string().optional(),
        range: z.number().min(0).max(100).optional(),
        description: z.string().optional(),
        publicName: z.string().optional(),
        aboutMe: z.string().optional(),
        coachingActivities: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.internalRole === "ADMIN" && ctx.user?.internalRole !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can give admin access",
        });

      const result = await db.transaction(async (tx) => {
        if (
          input.internalRole === "COACH" ||
          input.internalRole === "MANAGER_COACH"
        ) {
          const initialCoach = (await tx.query.userCoach.findFirst({
            where: eq(userCoach.userId, input.id),
          })) ?? { convexRoomId: undefined };
          const coachRecord = await tx
            .update(userCoach)
            .set({
              ...initialCoach,
              userId: input.id,
              longitude: input.longitude,
              latitude: input.latitude,
              searchAddress: input.searchAddress,
              range: input.range,
              publicName: input.publicName,
              aboutMe: input.aboutMe,
              description: input.description,
            })
            .returning();

          // Create Convex room for coach
          if (!initialCoach?.convexRoomId) {
            const coachName = input.publicName ?? input.name ?? "Coach";
            const convexRoomId = await createCoachRoomInConvex(
              input.id,
              coachName,
            );

            // Update coach record with Convex room ID
            if (convexRoomId && coachRecord[0]) {
              await tx
                .update(userCoach)
                .set({ convexRoomId: String(convexRoomId) })
                .where(eq(userCoach.userId, input.id));
            }
          }
        }
        return tx
          .update(user)
          .set({
            name: input.name,
            email: input.email,
            phone: input.phone,
            address: input.address,
            internalRole: input.internalRole,
            pricingId: input.pricingId,
            monthlyPayment: input.monthlyPayment,
            cancelationDate: input.cancelationDate,
            image: input.profileImageUrl,
          })
          .where(eq(user.id, input.id))
          .returning();
      });
      return result;
    }),
  deleteUser: protectedProcedure
    .input(z.string())
    .mutation(({ ctx, input }) => {
      if (ctx.user?.internalRole !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can delete a user",
        });
      return db.delete(user).where(eq(user.id, input));
    }),
  updatePaymentPeriod: protectedProcedure
    .input(z.object({ userId: z.string(), monthlyPayment: z.boolean() }))
    .mutation(({ ctx, input }) => {
      if (ctx.user?.id !== input.userId && ctx.user?.internalRole !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin or actual user can change periodicity",
        });
      return db
        .update(user)
        .set({ monthlyPayment: input.monthlyPayment })
        .where(eq(user.id, input.userId));
    }),
  addSubscriptionWithValidation: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        subscriptionId: z.string(),
        monthly: z.boolean().default(true),
        online: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      // notify the club manager
      const sub = await db.query.subscription.findFirst({
        where: eq(subscription.id, input.subscriptionId),
        with: { club: true },
      });
      const managerId = sub?.club.managerId;
      if (managerId) {
        await createNotificationInConvex(
          managerId,
          input.userId,
          "NEW_SUBSCRIPTION",
          "",
          {
            subscriptionId: input.subscriptionId,
            monthly: input.monthly,
            online: input.online,
          },
        );
      }
      const clubId = sub?.club.id;
      if (clubId) {
        await addMemberToClubRoomInConvex(clubId, input.userId);
      }
      const member = await db.query.userMember.findFirst({
        where: eq(userMember.userId, input.userId),
      });
      let memberId = member?.id;
      if (!member) {
        const newMember = await db
          .insert(userMember)
          .values({
            userId: input.userId,
          })
          .returning();
        memberId = newMember[0].id;
      }
      return db.insert(userMemberToSubscription).values({
        userId: memberId!,
        subscriptionId: input.subscriptionId,
      });
    }),
  deleteSubscription: protectedProcedure
    .input(z.object({ userId: z.string(), subscriptionId: z.cuid2() }))
    .mutation(({ input }) =>
      db
        .delete(userMemberToSubscription)
        .where(
          and(
            eq(userMemberToSubscription.userId, input.userId),
            eq(userMemberToSubscription.subscriptionId, input.subscriptionId),
          ),
        ),
    ),
  createUserWithCredentials: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // check if user exist with email
      const userData = await db.query.user.findFirst({
        where: eq(user.email, input.email),
      });
      if (userData)
        throw new TRPCError({
          code: "CONFLICT",
          message: "email already in use",
        });
      const newUser = await auth.api.createUser({
        body: {
          email: input.email,
          password: input.password,
          name: input.name,
          role: "user",
          data: { internalRole: "MEMBER" },
        },
      });
      return newUser;
    }),
});
