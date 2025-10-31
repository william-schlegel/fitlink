import { and, count, desc, eq, isNull } from "drizzle-orm";
import z from "zod";

import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";
import { notificationTypeEnum } from "@/db/schema/enums";
import { userNotification } from "@/db/schema/user";
import { db } from "@/db";

export type GetNotificationByIdReturn =
  | (Omit<typeof userNotification.$inferSelect, "userTo" | "userFrom"> & {
      userFrom: {
        name: string;
        imageUrl: string;
      };
      userTo: {
        name: string;
        imageUrl: string;
      };
    })
  | null;

export async function getNotificationToUser(
  userToId?: string,
  userFromId?: string,
  take?: number,
  skip?: number,
  unreadOnly?: boolean,
) {
  const total = await db
    .select({ count: count() })
    .from(userNotification)
    .where(
      and(
        userToId ? eq(userNotification.userToId, userToId) : undefined,
        userFromId ? eq(userNotification.userFromId, userFromId) : undefined,
      ),
    );
  const unread = await db
    .select({ count: count() })
    .from(userNotification)
    .where(
      and(
        userToId ? eq(userNotification.userToId, userToId) : undefined,
        userFromId ? eq(userNotification.userFromId, userFromId) : undefined,
        unreadOnly ? isNull(userNotification.viewDate) : undefined,
      ),
    );

  const notifications = await db.query.userNotification.findMany({
    where: and(
      userToId ? eq(userNotification.userToId, userToId) : undefined,
      userFromId ? eq(userNotification.userFromId, userFromId) : undefined,
      unreadOnly ? isNull(userNotification.viewDate) : undefined,
    ),
    limit: take,
    offset: skip,
    orderBy: desc(userNotification.date),
  });
  return { notifications, unread: unread[0].count, total: total[0].count };
}

export async function getNotificationById(
  notificationId: string,
  updateViewDate?: boolean,
) {
  const notification = await db.query.userNotification.findFirst({
    where: eq(userNotification.id, notificationId),
    with: {
      userFrom: {
        columns: {
          id: true,
          name: true,
          image: true,
          profileImageId: true,
        },
      },
      userTo: {
        columns: {
          id: true,
          name: true,
          image: true,
          profileImageId: true,
        },
      },
    },
  });
  if (notification && !notification?.viewDate && updateViewDate) {
    const viewDate = new Date(Date.now());
    await db
      .update(userNotification)
      .set({
        viewDate,
      })
      .where(eq(userNotification.id, notificationId))
      .returning();
    notification.viewDate = viewDate!;
  }
  const urlFrom = notification?.userFrom?.image;

  const urlTo = notification?.userTo?.image;

  if (!notification) return null;
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    viewDate: notification.viewDate,
    date: notification.date,
    data: notification.data,
    answered: notification.answered,
    answer: notification.answer,
    linkedNotification: notification.linkedNotification,
    userFromId: notification.userFromId,
    userToId: notification.userToId,
    userFrom: {
      name: notification.userFrom.name ?? "",
      imageUrl: urlFrom ?? "/images/dummy?jpg",
    },
    userTo: {
      name: notification.userTo.name ?? "",
      imageUrl: urlTo ?? "/images/dummy?jpg",
    },
  };
}

export const notificationRouter = createTRPCRouter({
  getNotificationById: protectedProcedure
    .input(
      z.object({
        notificationId: z.cuid2(),
        updateViewDate: z.boolean().default(true).optional(),
      }),
    )
    .query<GetNotificationByIdReturn>(async ({ input }) =>
      getNotificationById(input.notificationId, input.updateViewDate),
    ),
  updateNotification: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        answered: z.date(),
        answer: z.string(),
        linkedNotification: z.string().optional(),
      }),
    )
    .mutation(({ input }) =>
      db
        .update(userNotification)
        .set({
          answered: input.answered,
          answer: input.answer,
          linkedNotification: input.linkedNotification,
        })
        .where(eq(userNotification.id, input.id))
        .returning(),
    ),

  getNotificationFromUser: protectedProcedure
    .input(
      z.object({
        userFromId: z.cuid2(),
        take: z.number().default(10),
        skip: z.number().default(0),
        unreadOnly: z.boolean().default(false),
      }),
    )
    .query(({ input }) =>
      db.query.userNotification.findMany({
        where: eq(userNotification.userFromId, input.userFromId),
        limit: input.take,
        offset: input.skip,
      }),
    ),
  getNotificationToUser: protectedProcedure
    .input(
      z.object({
        userToId: z.cuid2().optional(),
        userFromId: z.cuid2().optional(),
        take: z.number().default(10).optional(),
        skip: z.number().default(0).optional(),
        unreadOnly: z.boolean().default(false).optional(),
      }),
    )
    .query(async ({ input }) =>
      getNotificationToUser(
        input.userToId,
        input.userFromId,
        input.take,
        input.skip,
        input.unreadOnly,
      ),
    ),
  createNotificationToUsers: protectedProcedure
    .input(
      z.object({
        type: z.enum(notificationTypeEnum.enumValues),
        from: z.cuid2(),
        to: z.array(z.cuid2()),
        message: z.string(),
        data: z.string().optional(),
        linkedNotification: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const data = input.data ? JSON.parse(input.data) : {};
      return db
        .insert(userNotification)
        .values(
          input.to.map((to) => ({
            type: input.type,
            userFromId: input.from,
            userToId: to,
            message: input.message,
            data,
            linkedNotification: input.linkedNotification,
          })),
        )
        .returning();
    }),
  createNotificationToUser: protectedProcedure
    .input(
      z.object({
        type: z.enum(notificationTypeEnum.enumValues),
        from: z.cuid2(),
        to: z.cuid2(),
        message: z.string(),
        data: z.string().optional(),
        linkedNotification: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const data = input.data ? JSON.parse(input.data) : {};
      return db.insert(userNotification).values({
        type: input.type,
        userFromId: input.from,
        userToId: input.to,
        message: input.message,
        data,
        linkedNotification: input.linkedNotification,
      });
    }),
});
