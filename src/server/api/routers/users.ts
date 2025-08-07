import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { db } from "@/db";
import { and, asc, count, eq, gte, ilike, SQL } from "drizzle-orm";
import { roleEnum } from "@/db/schema/enums";
import { user } from "@/db/schema/auth";
import { getDocUrl } from "./files";
import { reservation } from "@/db/schema/planning";
import { TRPCError } from "@trpc/server";
import { userCoach, userManager, userMember } from "@/db/schema/user";
import { club, coachingActivity } from "@/db/schema/club";
import { subscription } from "@/db/schema/subscription";

const UserFilter = z
  .object({
    name: z.string(),
    email: z.string(),
    role: z.enum(roleEnum.enumValues),
    dueDate: z.date(),
    dateOperation: z.enum(["gt", "lt"]),
  })
  .partial();

export async function getUserById(id: string) {
  const u = await db.query.user.findFirst({
    where: eq(user.id, id),
    with: {
      pricing: {
        with: {
          features: true,
        },
      },
      paiements: true,
      accounts: true,
    },
  });
  let coachData:
    | (typeof userCoach.$inferSelect & {
        coachingActivities?: (typeof coachingActivity.$inferSelect)[];
      })
    | null
    | undefined = null;
  if (u?.role === "COACH" || u?.role === "MANAGER_COACH") {
    coachData = await db.query.userCoach.findFirst({
      where: eq(userCoach.userId, id),
      with: {
        coachingActivities: true,
      },
    });
  }
  let memberData:
    | (typeof userMember.$inferSelect & {
        subscriptions?: (typeof subscription.$inferSelect)[];
      })
    | null
    | undefined = null;
  if (u?.role === "MEMBER") {
    memberData = await db.query.userMember.findFirst({
      where: eq(userMember.userId, id),
      with: {
        subscriptions: true,
      },
    });
  }
  let managerData:
    | (typeof userManager.$inferSelect & {
        managedClubs?: (typeof club.$inferSelect)[];
      })
    | null
    | undefined = null;
  if (u?.role === "MANAGER" || u?.role === "MANAGER_COACH") {
    managerData = await db.query.userManager.findFirst({
      where: eq(userManager.userId, id),
      with: {
        managedClubs: true,
      },
    });
  }
  // TODO: add chat token
  // if (u?.id && !u?.chatToken) {
  //   const token = createToken(user.id);
  //   user.chatToken = token;
  //   await ctx.prisma.user.update({
  //     where: { id: input },
  //     data: { chatToken: token },
  //   });
  // }
  let profileImageUrl = u?.image ?? "/images/dummy.jpg";
  if (u?.profileImageId) {
    profileImageUrl = await getDocUrl(u.id, u.profileImageId);
  }
  return { ...u, coachData, memberData, managerData, profileImageUrl };
}

export const userRouter = createTRPCRouter({
  getUserById: publicProcedure
    .input(z.cuid())
    .query(async ({ input }) => getUserById(input)),
  getUserSubscriptionsById: protectedProcedure
    .input(z.cuid())
    .query(({ input }) => {
      return db.query.user.findFirst({
        where: eq(user.id, input),
        with: {
          memberData: {
            with: {
              subscriptions: {
                with: {
                  activitieGroups: true,
                  activities: true,
                  sites: true,
                  rooms: true,
                  club: true,
                },
              },
            },
          },
        },
      });
    }),
  getReservationsByUserId: protectedProcedure
    .input(z.object({ userId: z.cuid(), after: z.date() }))
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
    .input(z.cuid())
    .query(({ ctx, input }) => {
      if (ctx.user?.role !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can acceed full",
        });
      return db.query.user.findFirst({
        where: eq(user.id, input),
        with: {
          pricing: true,
          paiements: true,
          managerData: {
            with: {
              managedClubs: {
                columns: {
                  id: true,
                },
              },
            },
          },
          coachData: {
            with: {
              certifications: true,
              page: true,
              clubs: true,
            },
          },
        },
      });
    }),
  getAllUsers: protectedProcedure
    .input(
      z.object({
        filter: UserFilter,
        skip: z.number(),
        take: z.number(),
      })
    )
    .query(({ ctx, input }) => {
      if (ctx.user?.role !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can acceed users",
        });
      const filter: SQL[] = [];
      if (input.filter?.name)
        filter.push(ilike(user.name, `%${input.filter.name}%`));
      if (input.filter?.email)
        filter.push(ilike(user.email, `%${input.filter.email}%`));
      if (input.filter?.role) filter.push(eq(user.role, input.filter.role));
      if (input.filter?.dueDate)
        filter.push(eq(user.cancelationDate, input.filter.dueDate));
      return db.transaction(async (tx) => {
        await tx
          .select({ count: count() })
          .from(user)
          .where(and(...filter));
        await tx
          .select()
          .from(user)
          .where(and(...filter))
          .limit(input.take)
          .offset(input.skip);
      });
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.cuid(),
        name: z.string().optional(),
        email: z.email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        role: z.enum(roleEnum.enumValues).optional(),
        pricingId: z.cuid().optional(),
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
      if (input.role === "ADMIN" && ctx.user?.role !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can give admin access",
        });
      if (input.role === "COACH" || input.role === "MANAGER_COACH") {
        await db.delete(userCoach).where(eq(userCoach.userId, input.id));
        await db.insert(userCoach).values({
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

      // update role in stream chat if admin
      if (input.role === "ADMIN") {
        await streamchatClient.partialUpdateUser({
          id: input.id,
          set: { role: "admin" },
        });
      }

      return ctx.prisma.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          address: input.address,
          role: input.role,
          profileImageId: input.profileImageId,
          pricingId: input.pricingId,
          monthlyPayment: input.monthlyPayment,
          cancelationDate: input.cancelationDate,
        },
      });
    }),
  deleteUser: protectedProcedure
    .input(z.string())
    .mutation(({ ctx, input }) => {
      if (ctx.session.user?.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can delete a user",
        });
      return ctx.prisma.user.delete({ where: { id: input } });
    }),
  updatePaymentPeriod: protectedProcedure
    .input(z.object({ userId: z.cuid(), monthlyPayment: z.boolean() }))
    .mutation(({ ctx, input }) => {
      if (
        ctx.session.user?.id !== input.userId &&
        ctx.session.user?.role !== Role.ADMIN
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin or actual user can change periodicity",
        });
      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { monthlyPayment: input.monthlyPayment },
      });
    }),
  addSubscriptionWithValidation: protectedProcedure
    .input(
      z.object({
        userId: z.cuid(),
        subscriptionId: z.cuid(),
        monthly: z.boolean().default(true),
        online: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // notify the club manager
      const sub = await ctx.prisma.subscription.findFirst({
        where: { id: input.subscriptionId },
        with: { club: true },
      });
      console.log("sub", sub);
      const managerId = sub?.club.managerId;
      console.log("managerId", managerId);
      if (managerId) {
        await ctx.prisma.userNotification.create({
          data: {
            userFromId: input.userId,
            userToId: managerId,
            type: "NEW_SUBSCRIPTION",
            message: "",
            data: {
              subscriptionId: input.subscriptionId,
              monthly: input.monthly,
              online: input.online,
            },
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
  deleteSubscription: protectedProcedure
    .input(z.object({ userId: z.cuid(), subscriptionId: z.cuid() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.userMember.update({
        where: { userId: input.userId },
        data: {
          subscriptions: {
            disconnect: {
              id: input.subscriptionId,
            },
          },
        },
      })
    ),
  createUserWithCredentials: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // check if user exist with email
      const user = await ctx.prisma.user.findFirst({
        where: { email: input.email },
      });
      if (user)
        throw new TRPCError({
          code: "CONFLICT",
          message: "email already in use",
        });
      // encrypt password
      const encPwd = await bcrypt.hash(input.password, 12);
      // create user
      return ctx.prisma.user.create({
        data: {
          email: input.email,
          password: encPwd,
          name: input.name,
        },
      });
    }),
  getUserByCredentials: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { email: input.email },
      });
      if (!user)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "wrong credentials",
        });
      const pwdOk = await bcrypt.compare(input.password, user.password ?? "");
      if (!pwdOk)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "wrong credentials",
        });
      return user;
    }),
});
