import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Queries
export const getMessages = query({
  args: {
    roomId: v.id("chatRooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_roomId_createdAt", (q) =>
        q.eq("roomId", args.roomId),
      )
      .order("desc")
      .take(limit);

    // Fetch reactions for each message
    const messagesWithReactions = await Promise.all(
      messages.map(async (message) => {
        const reactions = await ctx.db
          .query("messageReactions")
          .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
          .collect();

        return {
          ...message,
          reactions,
        };
      }),
    );

    return messagesWithReactions.reverse(); // Return in chronological order
  },
});

export const getRoomsForUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isBanned"), false))
      .collect();

    const rooms = await Promise.all(
      memberships.map(async (membership) => {
        const room = await ctx.db.get(membership.roomId);
        if (!room) return null;

        // Get unread count
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_roomId_createdAt", (q) =>
            q.eq("roomId", membership.roomId),
          )
          .filter((q) => {
            const lastRead = membership.lastReadAt ?? 0;
            return q.gt(q.field("createdAt"), lastRead);
          })
          .collect();

        return {
          ...room,
          membership,
          unreadCount: unreadMessages.length,
        };
      }),
    );

    return rooms.filter((room) => room !== null);
  },
});

export const getRoomMembers = query({
  args: {
    roomId: v.id("chatRooms"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
  },
});

export const getUnreadCount = query({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId),
      )
      .first();

    if (!membership) return 0;

    const lastReadAt = membership.lastReadAt ?? 0;

    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_roomId_createdAt", (q) =>
        q.eq("roomId", args.roomId),
      )
      .filter((q) => q.gt(q.field("createdAt"), lastReadAt))
      .collect();

    return unreadMessages.length;
  },
});

// Mutations
export const sendMessage = mutation({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.string(),
    content: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    replyToMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    // Check if user is banned
    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this room");
    }

    if (membership.isBanned) {
      const now = Date.now();
      if (
        membership.bannedUntil &&
        membership.bannedUntil > now
      ) {
        throw new Error("User is banned from this room");
      }
      // Ban expired, unban
      await ctx.db.patch(membership._id, {
        isBanned: false,
        bannedUntil: undefined,
      });
    }

    // Check global ban
    const globalBan = await ctx.db
      .query("bannedUsers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (globalBan) {
      throw new Error("User is globally banned");
    }

    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: args.userId,
      content: args.content,
      imageUrls: args.imageUrls ?? [],
      replyToMessageId: args.replyToMessageId,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.userId !== args.userId) {
      throw new Error("Only the message author can edit it");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      editedAt: Date.now(),
    });
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user is the author or an admin
    if (message.userId !== args.userId && !args.isAdmin) {
      throw new Error("Only the message author or an admin can delete it");
    }

    // Delete reactions first
    const reactions = await ctx.db
      .query("messageReactions")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .collect();

    await Promise.all(reactions.map((reaction) => ctx.db.delete(reaction._id)));

    // Delete the message
    await ctx.db.delete(args.messageId);
  },
});

export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if reaction already exists
    const existing = await ctx.db
      .query("messageReactions")
      .withIndex("by_messageId_userId_emoji", (q) =>
        q
          .eq("messageId", args.messageId)
          .eq("userId", args.userId)
          .eq("emoji", args.emoji),
      )
      .first();

    if (existing) {
      // Remove reaction if it already exists (toggle)
      await ctx.db.delete(existing._id);
      return;
    }

    await ctx.db.insert("messageReactions", {
      messageId: args.messageId,
      userId: args.userId,
      emoji: args.emoji,
      createdAt: Date.now(),
    });
  },
});

export const removeReaction = mutation({
  args: {
    reactionId: v.id("messageReactions"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const reaction = await ctx.db.get(args.reactionId);
    if (!reaction) {
      throw new Error("Reaction not found");
    }

    if (reaction.userId !== args.userId) {
      throw new Error("Only the reaction author can remove it");
    }

    await ctx.db.delete(args.reactionId);
  },
});

export const markAsRead = mutation({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this room");
    }

    await ctx.db.patch(membership._id, {
      lastReadAt: Date.now(),
    });
  },
});

export const getRoomByClubId = query({
  args: {
    clubId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatRooms")
      .withIndex("by_clubId", (q) => q.eq("clubId", args.clubId))
      .first();
  },
});

export const getRoomByCoachId = query({
  args: {
    coachId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatRooms")
      .withIndex("by_coachId", (q) => q.eq("coachId", args.coachId))
      .first();
  },
});

