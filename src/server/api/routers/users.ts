import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { db } from "@/db";
import { and, asc, count, eq, gte, ilike, SQL } from "drizzle-orm";
import { featureEnum, roleEnum } from "@/db/schema/enums";
import { user } from "@/db/schema/auth";
import { getDocUrl } from "./files";
import { reservation } from "@/db/schema/planning";
import { TRPCError } from "@trpc/server";
import {
  userCoach,
  userManager,
  userMember,
  userNotification,
} from "@/db/schema/user";
import {
  activity,
  activityGroup,
  club,
  coachingActivity,
  room,
  site,
} from "@/db/schema/club";
import { pricing, subscription } from "@/db/schema/subscription";
import { isAdmin } from "@/server/lib/userTools";
import { TUserFilter } from "@/app/admin/users/userFilter";
// import bcrypt from "bcrypt";

type FullSubscription = typeof subscription.$inferSelect & {
  activitieGroups: (typeof activityGroup.$inferSelect)[];
  activities: (typeof activity.$inferSelect)[];
  sites: (typeof site.$inferSelect)[];
  rooms: (typeof room.$inferSelect)[];
  club: typeof club.$inferSelect;
};

const UserFilter = z
  .object({
    name: z.string(),
    email: z.string(),
    internalRole: z.enum(roleEnum.enumValues),
    dueDate: z.date(),
    dateOperation: z.enum(["gt", "lt"]),
  })
  .partial();

type GetUserByIdFn = typeof getUserById;
type MemberSubscriptions = NonNullable<
  Awaited<ReturnType<GetUserByIdFn>>["memberData"]
>["subscriptions"];
export type MemberSubscription = MemberSubscriptions extends
  | (infer A)[]
  | undefined
  ? A
  : never;

export type GetUserByIdOptions = {
  withImage?: boolean;
  withMemberData?: boolean;
  withFeatures?: boolean;
  withPricing?: boolean;
};

export async function getUserById(id: string, options?: GetUserByIdOptions) {
  const u = await db.query.user.findFirst({
    where: eq(user.id, id),
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
  let profileImageUrl: string = u?.image ?? "/images/dummy.jpg";
  if (options?.withImage && u.profileImageId) {
    profileImageUrl = await getDocUrl(u.id, u.profileImageId);
  }
  let coachData:
    | (typeof userCoach.$inferSelect & {
        coachingActivities?: (typeof coachingActivity.$inferSelect)[];
      })
    | undefined = undefined;

  if (
    options?.withMemberData &&
    (u?.internalRole === "COACH" || u?.internalRole === "MANAGER_COACH")
  ) {
    coachData = await db.query.userCoach.findFirst({
      where: eq(userCoach.userId, id),
      with: {
        coachingActivities: true,
      },
    });
  }

  let pricingData: typeof pricing.$inferSelect | undefined = undefined;

  if (options?.withPricing) {
    pricingData = await db.query.pricing.findFirst({
      where: eq(pricing.id, id),
      with: {
        features: true,
      },
    });
  }

  let features: (typeof featureEnum.enumValues)[number][] = [];
  if (options?.withFeatures) {
    const featuresData = await db.query.pricing.findFirst({
      where: eq(pricing.id, id),
      with: {
        features: true,
      },
    });
    features = featuresData?.features.map((f) => f.feature) ?? [];
  }

  const memberData:
    | (typeof userMember.$inferSelect & {
        subscriptions?: FullSubscription[];
      })
    | undefined = undefined;

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
    coachData,
    memberData,
    pricing: pricingData,
    features,
  };

  // const u = await db.query.user.findFirst({
  //   where: eq(user.id, id),
  //   with: {
  //     pricing: {
  //       with: {
  //         features: true,
  //       },
  //     },
  //     paiements: true,
  //     accounts: true,
  //   },
  // });
  // let coachData:
  //   | (typeof userCoach.$inferSelect & {
  //       coachingActivities?: (typeof coachingActivity.$inferSelect)[];
  //     })
  //   | undefined = undefined;
  // if (u?.internalRole === "COACH" || u?.internalRole === "MANAGER_COACH") {
  //   coachData = await db.query.userCoach.findFirst({
  //     where: eq(userCoach.userId, id),
  //     with: {
  //       coachingActivities: true,
  //     },
  //   });
  // }
  // let memberData:
  //   | (typeof userMember.$inferSelect & {
  //       subscriptions?: FullSubscription[];
  //     })
  //   | undefined = undefined;
  // if (u?.internalRole === "MEMBER") {
  //   const memberJoin = await db.query.userMember.findFirst({
  //     where: eq(userMember.userId, id),
  //     with: {
  //       subscriptions: {
  //         with: {
  //           subscription: {
  //             with: {
  //               activitieGroups: {
  //                 with: {
  //                   activityGroup: true,
  //                 },
  //               },
  //               activities: {
  //                 with: {
  //                   activity: true,
  //                 },
  //               },
  //               sites: {
  //                 with: {
  //                   site: true,
  //                 },
  //               },
  //               rooms: {
  //                 with: {
  //                   room: true,
  //                 },
  //               },
  //               club: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  //   if (memberJoin) {
  //     memberData = {
  //       ...memberJoin,
  //       subscriptions:
  //         memberJoin.subscriptions?.map(({ subscription: s }) => ({
  //           ...s,
  //           activitieGroups: s.activitieGroups.map((j) => j.activityGroup),
  //           activities: s.activities.map((j) => j.activity),
  //           sites: s.sites.map((j) => j.site),
  //           rooms: s.rooms.map((j) => j.room),
  //         })) ?? [],
  //     };
  //   }
  // }
  // let managerData:
  //   | (typeof userManager.$inferSelect & {
  //       managedClubs?: (typeof club.$inferSelect)[];
  //     })
  //   | undefined = undefined;
  // if (u?.internalRole === "MANAGER" || u?.internalRole === "MANAGER_COACH") {
  //   managerData = await db.query.userManager.findFirst({
  //     where: eq(userManager.userId, id),
  //     with: {
  //       managedClubs: true,
  //     },
  //   });
  // }
  // // TODO: add chat token
  // // if (u?.id && !u?.chatToken) {
  // //   const token = createToken(user.id);
  // //   user.chatToken = token;
  // //   await ctx.prisma.user.update({
  // //     where: { id: input },
  // //     data: { chatToken: token },
  // //   });
  // // }
  // let profileImageUrl = u?.image ?? "/images/dummy.jpg";
  // if (u?.profileImageId) {
  //   profileImageUrl = await getDocUrl(u.id, u.profileImageId);
  // }
  // return {
  //   ...u,
  //   coachData: coachData ?? { coachingActivities: [] },
  //   memberData: memberData ?? { subscriptions: [] as FullSubscription[] },
  //   managerData: managerData ?? { managedClubs: [] },
  //   profileImageUrl,
  // };
}

export async function getAllUsers(input: {
  filter: TUserFilter;
  skip: number;
  take: number;
}) {
  await isAdmin(true);
  console.log("input", input);
  const filter: SQL[] = [];
  if (input.filter?.name)
    filter.push(ilike(user.name, `%${input.filter.name}%`));
  if (input.filter?.email)
    filter.push(ilike(user.email, `%${input.filter.email}%`));
  if (input.filter?.internalRole)
    filter.push(eq(user.internalRole, input.filter.internalRole));
  if (input.filter?.dueDate)
    filter.push(eq(user.cancelationDate, input.filter.dueDate));

  console.log("filter", filter);
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
          })
          .optional(),
      })
    )
    .query(({ input }) => getUserById(input.id, input.options)),
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
          gte(reservation.date, input.after)
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
      })
    )
    .query(({ input }) => getAllUsers(input)),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        internalRole: z.enum(roleEnum.enumValues).optional(),
        pricingId: z.cuid2().optional(),
        monthlyPayment: z.boolean().optional(),
        cancelationDate: z.date().optional(),
        profileImageId: z.string().optional(),
        // coach data
        longitude: z.number().optional(),
        latitude: z.number().optional(),
        searchAddress: z.string().optional(),
        range: z.number().min(0).max(100).optional(),
        description: z.string().optional(),
        publicName: z.string().optional(),
        aboutMe: z.string().optional(),
        coachingActivities: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.internalRole === "ADMIN" && ctx.user?.internalRole !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can give admin access",
        });

      db.transaction(async (tx) => {
        if (
          input.internalRole === "COACH" ||
          input.internalRole === "MANAGER_COACH"
        ) {
          await tx.delete(userCoach).where(eq(userCoach.userId, input.id));
          await tx.insert(userCoach).values({
            userId: input.id,
            longitude: input.longitude,
            latitude: input.latitude,
            searchAddress: input.searchAddress,
            range: input.range,
            publicName: input.publicName,
            aboutMe: input.aboutMe,
            description: input.description,
            // coachingActivities: Array.isArray(input.coachingActivities)
            //   ? {
            //       create: input.coachingActivities?.map((a) => ({ name: a })),
            //     }
            //   : undefined,
          });
          // create: {
          //   userId: input.id,
          //   longitude: input.longitude,
          //   latitude: input.latitude,
          //   searchAddress: input.searchAddress,
          //   range: input.range,
          //   publicName: input.publicName,
          //   aboutMe: input.aboutMe,
          //   description: input.description,
          //   coachingActivities: Array.isArray(input.coachingActivities)
          //     ? {
          //         create: input.coachingActivities?.map((a) => ({ name: a })),
          //       }
          //     : undefined,
          // },
          // });
        }

        // update internalRole in stream chat if admin
        // if (input.internalRole === "ADMIN") {
        //   await streamchatClient.partialUpdateUser({
        //     id: input.id,
        //     set: { internalRole: "admin" },
        //   });
        // }

        return tx
          .update(user)
          .set({
            name: input.name,
            email: input.email,
            phone: input.phone,
            address: input.address,
            internalRole: input.internalRole,
            profileImageId: input.profileImageId,
            pricingId: input.pricingId,
            monthlyPayment: input.monthlyPayment,
            cancelationDate: input.cancelationDate,
          })
          .where(eq(user.id, input.id))
          .returning();
      });
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
      })
    )
    .mutation(async ({ input }) => {
      // notify the club manager
      const sub = await db.query.subscription.findFirst({
        where: eq(subscription.id, input.subscriptionId),
        with: { club: true },
      });
      console.log("sub", sub);
      const managerId = sub?.club.managerId;
      console.log("managerId", managerId);
      if (managerId) {
        await db.insert(userNotification).values({
          userFromId: input.userId,
          userToId: managerId,
          type: "NEW_SUBSCRIPTION",
          message: "",
          data: {
            subscriptionId: input.subscriptionId,
            monthly: input.monthly,
            online: input.online,
          },
        });
      }
      // const member = await ctx.prisma.userMember.findFirst({
      //   where: { userId: input.userId },
      // });
      // if (!member) {
      //   return ctx.prisma.userMember.create({
      //     data: {
      //       userId: input.userId,
      //       subscriptions: {
      //         connect: {
      //           id: input.subscriptionId,
      //         },
      //       },
      //     },
      //   });
      // }
      // return ctx.prisma.userMember.update({
      //   where: { userId: input.userId },
      //   data: {
      //     subscriptions: {
      //       connect: {
      //         id: input.subscriptionId,
      //       },
      //     },
      //   },
      // });
    }),
  // deleteSubscription: protectedProcedure
  //   .input(z.object({ userId: z.string(), subscriptionId: z.cuid2() }))
  //   .mutation(({ ctx, input }) =>
  //     db.update(userMember).set({
  //         subscriptions: {
  //           disconnect: {
  //             id: input.subscriptionId,
  //           },
  //         },
  //       },
  //     })
  //   ,
  // createUserWithCredentials: publicProcedure
  //   .input(
  //     z.object({
  //       name: z.string(),
  //       email: z.string().email(),
  //       password: z.string(),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     // check if user exist with email
  //     const userData = await db.query.user.findFirst({
  //       where: eq(user.email, input.email),
  //     });
  //     if (userData)
  //       throw new TRPCError({
  //         code: "CONFLICT",
  //         message: "email already in use",
  //       });
  //     // encrypt password
  //     const encPwd = await bcrypt.hash(input.password, 12);
  //     // create user
  //     return db.insert(user).values({
  //         email: input.email,
  //         password: encPwd,
  //         name: input.name,
  //     });
  //   }),
  // getUserByCredentials: publicProcedure
  //   .input(z.object({ email: z.email(), password: z.string() }))
  //   .query(async ({ input }) => {
  //     const userData = await db.query.user.findFirst({
  //       where: eq(user.email, input.email ),
  //     });
  //     if (!userData)
  //       throw new TRPCError({
  //         code: "BAD_REQUEST",
  //         message: "wrong credentials",
  //       });
  //     const pwdOk = await bcrypt.compare(input.password, userData.password ?? "");
  //     if (!pwdOk)
  //       throw new TRPCError({
  //         code: "BAD_REQUEST",
  //         message: "wrong credentials",
  //       });
  //     return user;
  //   }),
});
