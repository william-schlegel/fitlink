import { and, asc, eq, gt } from "drizzle-orm";
import z from "zod";

import {
  channel,
  channelUsers,
  directConversation,
  message,
  messageTypeEnum,
} from "@/db/schema/chat";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";
import { createChannelService } from "@/server/lib/chat";
import { db } from "@/db";

export const chatRouter = createTRPCRouter({
  createChannel: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        createdByUserId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return createChannelService(input);
    }),
  updateChannel: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return db
        .update(channel)
        .set({ name: input.name })
        .where(eq(channel.id, input.id))
        .returning();
    }),
  deleteChannel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.delete(channel).where(eq(channel.id, input.id)).returning();
    }),
  addUserToChannel: protectedProcedure
    .input(z.object({ channelId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      return db
        .insert(channelUsers)
        .values({ channelId: input.channelId, userId: input.userId })
        .returning();
    }),
  removeUserFromChannel: protectedProcedure
    .input(z.object({ channelId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      return db
        .delete(channelUsers)
        .where(
          and(
            eq(channelUsers.channelId, input.channelId),
            eq(channelUsers.userId, input.userId),
          ),
        )
        .returning();
    }),
  getChannelsForUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return db.query.channelUsers.findMany({
        where: eq(channelUsers.userId, input.userId),
        with: { channel: true },
      });
    }),
  getUsersForChannel: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }) => {
      return db.query.channelUsers.findMany({
        where: eq(channelUsers.channelId, input.channelId),
        with: { user: true },
      });
    }),
  getMessagesForChannel: protectedProcedure
    .input(z.object({ channelId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return db.query.message.findMany({
        where: eq(message.channelId, input.channelId),
        orderBy: asc(message.createdAt),
        limit: input.limit,
      });
    }),
  sendMessageToChannel: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        content: z.string(),
        userId: z.string(),
        type: z.enum(messageTypeEnum.enumValues).optional(),
        replyToMessageId: z.string().optional(),
        imageDocumentId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return db
        .insert(message)
        .values({
          channelId: input.channelId,
          content: input.content,
          userId: input.userId,
          type: input.type,
          replyToMessageId: input.replyToMessageId,
          imageDocumentId: input.imageDocumentId,
        })
        .returning();
    }),
  deleteMessageFromChannel: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ input }) => {
      return db
        .delete(message)
        .where(eq(message.id, input.messageId))
        .returning();
    }),
  getUsersWithDirectConversation: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return db.query.directConversation.findMany({
        where: eq(directConversation.userAId, input.userId),
        with: {
          userB: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    }),
  getUnreadMessagesForUserInChannel: protectedProcedure
    .input(z.object({ userId: z.string(), channelId: z.string() }))
    .query(async ({ input }) => {
      const channelUser = await db.query.channelUsers.findFirst({
        where: and(
          eq(channelUsers.userId, input.userId),
          eq(channelUsers.channelId, input.channelId),
        ),
      });
      if (!channelUser) return [];
      return db.query.message.findMany({
        where: and(
          eq(message.channelId, input.channelId),
          gt(message.createdAt, channelUser.lastReadAt ?? new Date(0)),
        ),
      });
    }),
  getUnreadMessagesForUserInDirectConversation: protectedProcedure
    .input(z.object({ userId: z.string(), directConversationId: z.string() }))
    .query(async ({ input }) => {
      return db.query.message.findMany({
        where: and(
          eq(message.directConversationId, input.directConversationId),

          gt(
            message.createdAt,
            directConversation.userBLastReadAt ?? new Date(0),
          ),
        ),
      });
    }),
  markChannelMessageAsRead: protectedProcedure
    .input(z.object({ userId: z.string(), channelId: z.string() }))
    .mutation(async ({ input }) => {
      return db
        .update(channelUsers)
        .set({ lastReadAt: new Date() })
        .where(
          and(
            eq(channelUsers.userId, input.userId),
            eq(channelUsers.channelId, input.channelId),
          ),
        )
        .returning();
    }),
  markDirectConversationMessageAsRead: protectedProcedure
    .input(z.object({ userId: z.string(), directConversationId: z.string() }))
    .mutation(async ({ input }) => {
      return db
        .update(directConversation)
        .set({ userBLastReadAt: new Date() })
        .where(
          and(
            eq(directConversation.userAId, input.userId),
            eq(directConversation.userBId, input.userId),
          ),
        )
        .returning();
    }),
});
