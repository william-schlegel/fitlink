import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chatRooms: defineTable({
    type: v.union(v.literal("CLUB"), v.literal("COACH"), v.literal("DIRECT")),
    clubId: v.optional(v.string()),
    coachId: v.optional(v.string()),
    userIds: v.optional(v.array(v.string())), // For direct messages
    name: v.string(),
    createdAt: v.number(),
  })
    .index("by_clubId", ["clubId"])
    .index("by_coachId", ["coachId"])
    .index("by_type", ["type"])
    .index("by_userIds", ["userIds"]),

  messages: defineTable({
    roomId: v.id("chatRooms"),
    userId: v.string(),
    content: v.optional(v.string()),
    imageUrls: v.array(v.string()),
    replyToMessageId: v.optional(v.id("messages")),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("by_roomId", ["roomId"])
    .index("by_roomId_createdAt", ["roomId", "createdAt"])
    .index("by_userId", ["userId"])
    .index("by_replyToMessageId", ["replyToMessageId"]),

  messageReactions: defineTable({
    messageId: v.id("messages"),
    userId: v.string(),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_userId", ["userId"])
    .index("by_messageId_userId_emoji", ["messageId", "userId", "emoji"]),

  roomMembers: defineTable({
    roomId: v.id("chatRooms"),
    userId: v.string(),
    isAdmin: v.boolean(),
    isBanned: v.boolean(),
    bannedUntil: v.optional(v.number()),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()),
  })
    .index("by_roomId", ["roomId"])
    .index("by_userId", ["userId"])
    .index("by_roomId_userId", ["roomId", "userId"])
    .index("by_roomId_isAdmin", ["roomId", "isAdmin"])
    .index("by_roomId_isBanned", ["roomId", "isBanned"]),

  bannedUsers: defineTable({
    userId: v.string(),
    bannedBy: v.string(),
    reason: v.optional(v.string()),
    bannedAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  notifications: defineTable({
    userId: v.string(), // recipient user ID
    userFromId: v.string(), // sender user ID
    type: v.string(), // notification type enum values
    message: v.string(), // notification message
    data: v.optional(v.any()), // additional JSON data
    viewedAt: v.optional(v.number()), // timestamp when viewed
    createdAt: v.number(), // creation timestamp
    answeredAt: v.optional(v.number()), // timestamp when answered
    answer: v.optional(v.string()), // answer text
    linkedNotification: v.optional(v.string()), // linked notification ID
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_userFromId", ["userFromId"]),
});

