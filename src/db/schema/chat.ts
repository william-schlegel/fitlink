import { pgTable, text, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";

import { channelTypeEnum, messageTypeEnum, reactionTypeEnum } from "./enums";
import { userDocument } from "./user";
import { user } from "./auth";

// Enums local to chat schema

// Channels
export const channel = pgTable(
  "Channel",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    type: channelTypeEnum("type").default("PRIVATE").notNull(),
    imageDocumentId: text("image_document_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdByUserId: text("created_by_user_id"),
  },
  (table) => [
    index("channel_name_idx").on(table.name),
    index("channel_created_by_idx").on(table.createdByUserId),
  ],
);

export const channelRelations = relations(channel, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [channel.createdByUserId],
    references: [user.id],
  }),
  users: many(channelUsers),
  messages: many(message),
}));

// Channel membership (users in channel)
export const channelUsers = pgTable(
  "ChannelUsers",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    channelId: text("channel_id").notNull(),
    userId: text("user_id").notNull(),
    isAdmin: boolean("is_admin").default(false),
    isModerator: boolean("is_moderator").default(false),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    lastReadAt: timestamp("last_read_at"),
  },
  (table) => [
    index("channel_users_channel_idx").on(table.channelId),
    index("channel_users_user_idx").on(table.userId),
    index("channel_users_admin_idx").on(table.channelId, table.isAdmin),
    index("channel_users_moderator_idx").on(table.channelId, table.isModerator),
    index("channel_users_read_idx").on(table.channelId, table.lastReadAt),
    index("channel_users_unique").on(table.channelId, table.userId),
  ],
);

export const channelUsersRelations = relations(channelUsers, ({ one }) => ({
  channel: one(channel, {
    fields: [channelUsers.channelId],
    references: [channel.id],
  }),
  user: one(user, {
    fields: [channelUsers.userId],
    references: [user.id],
  }),
}));

// Direct user-to-user conversation
export const directConversation = pgTable(
  "DirectConversation",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userAId: text("user_a_id").notNull(),
    userBId: text("user_b_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    userALastReadAt: timestamp("user_a_last_read_at"),
    userBLastReadAt: timestamp("user_b_last_read_at"),
  },
  (table) => [
    index("direct_conversation_user_a_idx").on(table.userAId),
    index("direct_conversation_user_b_idx").on(table.userBId),
    index("direct_conversation_unique_pair").on(table.userAId, table.userBId),
    index("direct_conversation_user_a_read_idx").on(
      table.userAId,
      table.userALastReadAt,
    ),
    index("direct_conversation_user_b_read_idx").on(
      table.userBId,
      table.userBLastReadAt,
    ),
  ],
);

export const directConversationRelations = relations(
  directConversation,
  ({ one, many }) => ({
    userA: one(user, {
      fields: [directConversation.userAId],
      references: [user.id],
      relationName: "direct-user-a",
    }),
    userB: one(user, {
      fields: [directConversation.userBId],
      references: [user.id],
      relationName: "direct-user-b",
    }),
    messages: many(message),
  }),
);

// Messages
export const message = pgTable(
  "Message",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    channelId: text("channel_id"),
    directConversationId: text("direct_conversation_id"),
    userId: text("user_id").notNull(),
    type: messageTypeEnum("type").default("TEXT").notNull(),
    content: text("content"),
    // Optional image stored via UserDocument when type === IMAGE
    imageDocumentId: text("image_document_id"),
    replyToMessageId: text("reply_to_message_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    editedAt: timestamp("edited_at"),
  },
  (table) => [
    index("message_channel_idx").on(table.channelId),
    index("message_direct_conversation_idx").on(table.directConversationId),
    index("message_user_idx").on(table.userId),
    index("message_reply_to_idx").on(table.replyToMessageId),
    index("message_channel_created_idx").on(table.channelId, table.createdAt),
    index("message_direct_created_idx").on(
      table.directConversationId,
      table.createdAt,
    ),
  ],
);

export const messageRelations = relations(message, ({ one, many }) => ({
  channel: one(channel, {
    fields: [message.channelId],
    references: [channel.id],
  }),
  directConversation: one(directConversation, {
    fields: [message.directConversationId],
    references: [directConversation.id],
  }),
  author: one(user, {
    fields: [message.userId],
    references: [user.id],
  }),
  image: one(userDocument, {
    fields: [message.imageDocumentId],
    references: [userDocument.id],
  }),
  parent: one(message, {
    fields: [message.replyToMessageId],
    references: [message.id],
    relationName: "message-parent",
  }),
  replies: many(message, { relationName: "message-parent" }),
  reactions: many(messageReaction),
}));

// Reactions to messages
export const messageReaction = pgTable(
  "MessageReaction",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    messageId: text("message_id").notNull(),
    userId: text("user_id").notNull(),
    type: reactionTypeEnum("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("message_reaction_message_idx").on(table.messageId),
    index("message_reaction_user_idx").on(table.userId),
    index("message_reaction_unique").on(
      table.messageId,
      table.userId,
      table.type,
    ),
  ],
);

export const messageReactionRelations = relations(
  messageReaction,
  ({ one }) => ({
    message: one(message, {
      fields: [messageReaction.messageId],
      references: [message.id],
    }),
    user: one(user, {
      fields: [messageReaction.userId],
      references: [user.id],
    }),
  }),
);
