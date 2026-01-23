import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { TUserFilter } from "@/app/admin/users/userFilter";
import { db } from "@/db";
import {
  addSubscriptionToMember,
  deleteUser as dalDeleteUser,
  getAllUsers as dalGetAllUsers,
  getUserById as dalGetUserById,
  getUserFullById as dalGetUserFullById,
  updatePaymentPeriod as dalUpdatePaymentPeriod,
  updateUser as dalUpdateUser,
  deleteMemberSubscription,
  getMemberData,
  getOrCreateCoachData,
  getOrCreateMember,
  getPricingData,
  getReservationsByUserId,
  getSubscriptionWithClub,
  getUserAvatar,
  getUserByEmail,
  getUserSubscriptionsById,
  searchUsers,
  updateCoachData,
} from "@/db/dal";
import { featureEnum, roleEnum } from "@/db/schema/enums";
import { UserId, ZodUserId } from "@/db/types";
import { auth } from "@/lib/auth/server";
import {
  addMemberToClubRoomInConvex,
  createCoachRoomInConvex,
  createNotificationInConvex,
  getClubRoomId,
} from "@/lib/convex/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import {
  hasRole,
  isAdmin,
  requireAdmin,
  requireAdminOrSelf,
} from "@/server/lib/userTools";

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

export async function getAllUsers(input: {
  filter: TUserFilter;
  skip: number;
  take: number;
}) {
  await isAdmin(true);
  return dalGetAllUsers(input);
}

export async function getUserFullById(id: UserId) {
  await isAdmin(true);
  return dalGetUserFullById(id);
}

export type CoachDataOfferType = NonNullable<
  Awaited<ReturnType<typeof getMemberData>>["coachData"]
>["coachingPrices"][number];

export type MemberSubscriptionType = NonNullable<
  Awaited<ReturnType<typeof getMemberData>>["memberData"]
>["subscriptions"][number]["subscription"];

export const userRouter = createTRPCRouter({
  getUserById: publicProcedure
    .input(
      z.object({
        id: ZodUserId,
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
      const u = await dalGetUserById(input.id);
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

      if (input.options?.withPricing && u.pricingId)
        pricingData = await getPricingData(u.pricingId);

      let features: (typeof featureEnum.enumValues)[number][] = [];
      if (input.options?.withFeatures && u.pricingId) {
        const featuresData = await getPricingData(u.pricingId);
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
    }),

  getUserAvatar: protectedProcedure
    .input(z.object({ userId: ZodUserId }))
    .query(({ input }) => getUserAvatar(input.userId)),

  getUserSubscriptionsById: protectedProcedure
    .input(ZodUserId)
    .query(async ({ input }) => {
      const u = await getUserSubscriptionsById(input);
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
    .input(z.object({ userId: ZodUserId, after: z.date() }))
    .query(({ input }) => getReservationsByUserId(input.userId, input.after)),

  getUserFullById: protectedProcedure
    .input(ZodUserId)
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
    .query(({ input }) => searchUsers(input.query, input.limit)),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: ZodUserId,
        name: z.string().optional(),
        email: z.email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        internalRole: z.enum(roleEnum.enumValues),
        pricingId: z.cuid2().optional(),
        monthlyPayment: z.boolean().optional(),
        cancelationDate: z.date().optional(),
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
      // Special case: only admin can grant admin access
      if (input.internalRole === "ADMIN") {
        requireAdmin(ctx.user);
      }

      const result = await db.transaction(async (tx) => {
        if (
          input.internalRole === "COACH" ||
          input.internalRole === "MANAGER_COACH"
        ) {
          const initialCoach = await getOrCreateCoachData(input.id, tx);

          await updateCoachData(
            {
              id: initialCoach.id,
              userId: input.id,
              longitude: input.longitude,
              latitude: input.latitude,
              searchAddress: input.searchAddress,
              range: input.range,
              publicName: input.publicName,
              aboutMe: input.aboutMe,
              description: input.description,
              coachingActivities: input.coachingActivities,
            },
            tx,
          );

          // Create Convex room for coach (external call - not part of DB transaction)
          if (!initialCoach?.convexRoomId) {
            const coachName = input.publicName ?? input.name ?? "Coach";
            const convexRoomId = await createCoachRoomInConvex(
              input.id,
              coachName,
            );

            // Update coach record with Convex room ID
            if (convexRoomId) {
              await updateCoachData(
                {
                  id: initialCoach.id,
                  userId: input.id,
                  convexRoomId: String(convexRoomId),
                },
                tx,
              );
            }
          }
        }

        return dalUpdateUser(
          {
            id: input.id,
            name: input.name,
            email: input.email,
            phone: input.phone,
            address: input.address,
            internalRole: input.internalRole,
            pricingId: input.pricingId,
            monthlyPayment: input.monthlyPayment,
            cancelationDate: input.cancelationDate,
            image: input.profileImageUrl,
          },
          tx,
        );
      });
      return result;
    }),

  deleteUser: protectedProcedure.input(ZodUserId).mutation(({ ctx, input }) => {
    requireAdmin(ctx.user);
    return dalDeleteUser(input);
  }),

  updatePaymentPeriod: protectedProcedure
    .input(z.object({ userId: ZodUserId, monthlyPayment: z.boolean() }))
    .mutation(({ ctx, input }) => {
      requireAdminOrSelf(ctx.user, input.userId);
      return dalUpdatePaymentPeriod(input.userId, input.monthlyPayment);
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
      const sub = await getSubscriptionWithClub(input.subscriptionId);
      const managerId = sub?.club.managerId;
      if (managerId) {
        await createNotificationInConvex({
          userId: managerId,
          userFromId: input.userId,
          type: "NEW_SUBSCRIPTION",
          message: "",
          data: {
            subscriptionId: input.subscriptionId,
            monthly: input.monthly,
            online: input.online,
          },
        });
      }
      const clubId = sub?.club.id;
      if (clubId) {
        // Get the Convex room ID for this club, then add the member
        const roomId = await getClubRoomId(clubId);
        if (roomId) {
          await addMemberToClubRoomInConvex(roomId, input.userId);
        }
      }
      return true;
    }),

  validateSubscription: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        subscriptionId: z.cuid2(),
      }),
    )
    .mutation(async ({ input }) => {
      await hasRole(["ADMIN", "MANAGER", "MANAGER_COACH"]);
      const member = await getOrCreateMember(input.userId);
      return addSubscriptionToMember(member.id, input.subscriptionId);
    }),

  deleteSubscription: protectedProcedure
    .input(z.object({ userId: z.string(), subscriptionId: z.cuid2() }))
    .mutation(({ input }) =>
      deleteMemberSubscription(input.userId, input.subscriptionId),
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
      const userData = await getUserByEmail(input.email);
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
