import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// fake translation function
const t = (s: string, args?: Record<string, string>) => {
  if (!args) return s;
  return s.replace(/{(\w+)}/g, (match, key) => args[key] || match);
};

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
      .withIndex("by_roomId_createdAt", (q) => q.eq("roomId", args.roomId))
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
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // If admin, return all rooms (excluding DIRECT rooms)
    if (args.isAdmin) {
      const allRooms = await ctx.db
        .query("chatRooms")
        .filter((q) => q.neq(q.field("type"), "DIRECT"))
        .collect();

      const rooms = await Promise.all(
        allRooms.map(async (room) => {
          // Get membership if exists
          const membership = await ctx.db
            .query("roomMembers")
            .withIndex("by_roomId_userId", (q) =>
              q.eq("roomId", room._id).eq("userId", args.userId),
            )
            .first();

          // Get unread count
          const lastRead = membership?.lastReadAt ?? 0;
          const unreadMessages = await ctx.db
            .query("messages")
            .withIndex("by_roomId_createdAt", (q) => q.eq("roomId", room._id))
            .filter((q) => q.gt(q.field("createdAt"), lastRead))
            .collect();

          return {
            ...room,
            membership: membership ?? null,
            unreadCount: unreadMessages.length,
          };
        }),
      );

      return rooms;
    }

    // Non-admin: return only rooms where user has membership
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

export const hasRoomMembership = query({
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

    const room = await ctx.db.get(args.roomId);
    const isDirectMessage = room?.type === "DIRECT";
    const isDirectMessageToUser =
      isDirectMessage && room?.userIds?.includes(args.userId);

    return {
      hasMembership: !!membership,
      isDirectMessage,
      isDirectMessageToUser,
    };
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
      .withIndex("by_roomId_createdAt", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.gt(q.field("createdAt"), lastReadAt))
      .collect();

    return unreadMessages.length;
  },
});

export const getTotalUnreadCount = query({
  args: {
    userId: v.string(),
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get all unread counts for the user across all rooms
    let unreadCounts: number[] = [];

    if (args.isAdmin) {
      // Admin: Get all non-direct rooms
      const allRooms = await ctx.db
        .query("chatRooms")
        .filter((q) => q.neq(q.field("type"), "DIRECT"))
        .collect();

      unreadCounts = await Promise.all(
        allRooms.map(async (room) => {
          const membership = await ctx.db
            .query("roomMembers")
            .withIndex("by_roomId_userId", (q) =>
              q.eq("roomId", room._id).eq("userId", args.userId),
            )
            .first();

          const lastRead = membership?.lastReadAt ?? 0;
          const unreadMessages = await ctx.db
            .query("messages")
            .withIndex("by_roomId_createdAt", (q) => q.eq("roomId", room._id))
            .filter((q) => q.gt(q.field("createdAt"), lastRead))
            .collect();

          return unreadMessages.length;
        }),
      );
    } else {
      // Non-admin: Get all rooms where user has membership (including direct messages)
      const memberships = await ctx.db
        .query("roomMembers")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isBanned"), false))
        .collect();

      unreadCounts = await Promise.all(
        memberships.map(async (membership) => {
          const lastRead = membership.lastReadAt ?? 0;
          const unreadMessages = await ctx.db
            .query("messages")
            .withIndex("by_roomId_createdAt", (q) =>
              q.eq("roomId", membership.roomId),
            )
            .filter((q) => q.gt(q.field("createdAt"), lastRead))
            .collect();

          return unreadMessages.length;
        }),
      );
    }

    // Sum up all unread counts
    return unreadCounts.reduce((total, count) => total + count, 0);
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
      throw new Error(t("user-not-member-of-room"));
    }

    if (membership.isBanned) {
      const now = Date.now();
      if (membership.bannedUntil && membership.bannedUntil > now) {
        throw new Error(t("user-banned-from-room"));
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
      throw new Error(t("user-globally-banned"));
    }

    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: args.userId,
      content: args.content,
      imageUrls: args.imageUrls ?? [],
      replyToMessageId: args.replyToMessageId,
      createdAt: Date.now(),
    });

    // Get room to check if it's a direct message
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error(t("room-not-found"));
    }

    // Get all room members except the sender
    const allMembers = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .filter((q) =>
        q.and(
          q.neq(q.field("userId"), args.userId),
          q.eq(q.field("isBanned"), false),
        ),
      )
      .collect();

    // Determine recipients to notify
    let recipientsToNotify: string[] = [];

    if (room.type === "DIRECT" && room.userIds) {
      // For direct messages, notify the other user if they're not banned
      const otherUserId = room.userIds.find((id) => id !== args.userId);
      if (otherUserId) {
        // Check if other user is banned
        const otherMembership = await ctx.db
          .query("roomMembers")
          .withIndex("by_roomId_userId", (q) =>
            q.eq("roomId", args.roomId).eq("userId", otherUserId),
          )
          .first();

        if (!otherMembership || !otherMembership.isBanned) {
          recipientsToNotify.push(otherUserId);
        }
      }
    } else {
      // For group rooms, notify all non-banned members
      recipientsToNotify = allMembers.map((m) => m.userId);
    }

    // Create notifications for recipients
    if (recipientsToNotify.length > 0) {
      const notificationMessage =
        room.type === "DIRECT"
          ? t("new-direct-message")
          : t("new-message-in-room", { roomName: room.name });

      const now = Date.now();
      await Promise.all(
        recipientsToNotify.map((recipientId) =>
          ctx.db.insert("notifications", {
            userId: recipientId,
            userFromId: args.userId,
            type: "NEW_MESSAGE",
            message: notificationMessage,
            data: {
              roomId: args.roomId as string,
              messageId: messageId as string,
              roomType: room.type,
            },
            createdAt: now,
          }),
        ),
      );
    }

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
      throw new Error(t("message-not-found"));
    }

    if (message.userId !== args.userId) {
      throw new Error(t("only-message-author-can-edit"));
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
      throw new Error(t("message-not-found"));
    }

    // Check if user is the author or an admin
    if (message.userId !== args.userId && !args.isAdmin) {
      throw new Error(t("only-message-author-or-admin-can-delete"));
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

    // Mark all unread notifications for this room and user as viewed
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("type"), "NEW_MESSAGE"))
      .filter((q) => q.eq(q.field("viewedAt"), undefined))
      .collect();

    const now = Date.now();
    const roomIdString = args.roomId;
    await Promise.all(
      unreadNotifications
        .filter((notification) => {
          // Check if notification is for this room
          const data = notification.data as { roomId?: string } | undefined;
          return data?.roomId === roomIdString;
        })
        .map((notification) =>
          ctx.db.patch(notification._id, {
            viewedAt: now,
          }),
        ),
    );
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

export const getDirectConversations = query({
  args: {
    userId: v.string(),
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // If admin, return all direct message rooms
    if (args.isAdmin) {
      const allDirectRooms = await ctx.db
        .query("chatRooms")
        .withIndex("by_type", (q) => q.eq("type", "DIRECT"))
        .collect();

      const directRooms = await Promise.all(
        allDirectRooms.map(async (room) => {
          // Get the other user's ID (or first user if current user is not in the room)
          const otherUserId =
            room.userIds?.find((id) => id !== args.userId) ?? room.userIds?.[0];
          if (!otherUserId) return null;

          // Get membership if exists
          const membership = await ctx.db
            .query("roomMembers")
            .withIndex("by_roomId_userId", (q) =>
              q.eq("roomId", room._id).eq("userId", args.userId),
            )
            .first();

          // Get the last message in this room
          const lastMessage = await ctx.db
            .query("messages")
            .withIndex("by_roomId_createdAt", (q) => q.eq("roomId", room._id))
            .order("desc")
            .first();

          // Get unread count
          const lastReadAt = membership?.lastReadAt ?? 0;
          const unreadMessages = await ctx.db
            .query("messages")
            .withIndex("by_roomId_createdAt", (q) => q.eq("roomId", room._id))
            .filter((q) => q.gt(q.field("createdAt"), lastReadAt))
            .collect();

          return {
            roomId: room._id,
            otherUserId,
            lastMessage: lastMessage
              ? {
                  content: lastMessage.content,
                  createdAt: lastMessage.createdAt,
                  userId: lastMessage.userId,
                }
              : null,
            unreadCount: unreadMessages.length,
            lastReadAt: membership?.lastReadAt,
          };
        }),
      );

      return directRooms.filter((room) => room !== null);
    }

    // Non-admin: Get all direct message rooms where the user is a member
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isBanned"), false))
      .collect();

    const directRooms = await Promise.all(
      memberships.map(async (membership) => {
        const room = await ctx.db.get(membership.roomId);
        if (!room || room.type !== "DIRECT") return null;

        // Get the other user's ID
        const otherUserId = room.userIds?.find((id) => id !== args.userId);
        if (!otherUserId) return null;

        // Get the last message in this room
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_roomId_createdAt", (q) =>
            q.eq("roomId", membership.roomId),
          )
          .order("desc")
          .first();

        // Get unread count
        const lastReadAt = membership.lastReadAt ?? 0;
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_roomId_createdAt", (q) =>
            q.eq("roomId", membership.roomId),
          )
          .filter((q) => q.gt(q.field("createdAt"), lastReadAt))
          .collect();

        return {
          roomId: room._id,
          otherUserId,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                userId: lastMessage.userId,
              }
            : null,
          unreadCount: unreadMessages.length,
          lastReadAt: membership.lastReadAt,
        };
      }),
    );

    return directRooms.filter((room) => room !== null);
  },
});

export const getOrCreateDirectRoom = query({
  args: {
    userId1: v.string(),
    userId2: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if room already exists
    const rooms = await ctx.db
      .query("chatRooms")
      .withIndex("by_type", (q) => q.eq("type", "DIRECT"))
      .collect();

    const existing = rooms.find(
      (room) =>
        room.userIds?.includes(args.userId1) &&
        room.userIds?.includes(args.userId2),
    );

    if (existing) {
      return existing._id;
    }

    // Room doesn't exist, return null (frontend will create it via action)
    return null;
  },
});

export const sendDirectMessage = mutation({
  args: {
    fromUserId: v.string(),
    toUserId: v.string(),
    content: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    replyToMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    // Validate that both users are different
    if (args.fromUserId === args.toUserId) {
      throw new Error("Cannot send direct message to yourself");
    }

    // Check global ban for sender
    const globalBan = await ctx.db
      .query("bannedUsers")
      .withIndex("by_userId", (q) => q.eq("userId", args.fromUserId))
      .first();

    if (globalBan) {
      throw new Error("User is globally banned");
    }

    // Find or create direct room
    const rooms = await ctx.db
      .query("chatRooms")
      .withIndex("by_type", (q) => q.eq("type", "DIRECT"))
      .collect();

    let room = rooms.find(
      (r) =>
        r.userIds?.includes(args.fromUserId) &&
        r.userIds?.includes(args.toUserId),
    );

    let roomId: Id<"chatRooms">;

    if (!room) {
      // Create new direct message room
      roomId = await ctx.db.insert("chatRooms", {
        type: "DIRECT",
        userIds: [args.fromUserId, args.toUserId],
        name: "", // Direct messages don't need a name
        createdAt: Date.now(),
      });

      // Add both users as members
      await ctx.db.insert("roomMembers", {
        roomId,
        userId: args.fromUserId,
        isAdmin: false,
        isBanned: false,
        joinedAt: Date.now(),
      });

      await ctx.db.insert("roomMembers", {
        roomId,
        userId: args.toUserId,
        isAdmin: false,
        isBanned: false,
        joinedAt: Date.now(),
      });
    } else {
      roomId = room._id;

      // Ensure both users are members
      const fromMembership = await ctx.db
        .query("roomMembers")
        .withIndex("by_roomId_userId", (q) =>
          q.eq("roomId", roomId).eq("userId", args.fromUserId),
        )
        .first();

      if (!fromMembership) {
        await ctx.db.insert("roomMembers", {
          roomId,
          userId: args.fromUserId,
          isAdmin: false,
          isBanned: false,
          joinedAt: Date.now(),
        });
      }

      const toMembership = await ctx.db
        .query("roomMembers")
        .withIndex("by_roomId_userId", (q) =>
          q.eq("roomId", roomId).eq("userId", args.toUserId),
        )
        .first();

      if (!toMembership) {
        await ctx.db.insert("roomMembers", {
          roomId,
          userId: args.toUserId,
          isAdmin: false,
          isBanned: false,
          joinedAt: Date.now(),
        });
      }

      // Check if sender is banned from this room
      if (fromMembership?.isBanned) {
        const now = Date.now();
        if (fromMembership.bannedUntil && fromMembership.bannedUntil > now) {
          throw new Error("User is banned from this conversation");
        }
        // Ban expired, unban
        await ctx.db.patch(fromMembership._id, {
          isBanned: false,
          bannedUntil: undefined,
        });
      }
    }

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      roomId,
      userId: args.fromUserId,
      content: args.content,
      imageUrls: args.imageUrls ?? [],
      replyToMessageId: args.replyToMessageId,
      createdAt: Date.now(),
    });

    // Check if recipient is banned (they shouldn't receive notifications)
    const toMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", roomId).eq("userId", args.toUserId),
      )
      .first();

    // Create notification for recipient if they're not banned
    if (!toMembership || !toMembership.isBanned) {
      await ctx.db.insert("notifications", {
        userId: args.toUserId,
        userFromId: args.fromUserId,
        type: "NEW_MESSAGE",
        message: "New direct message",
        data: {
          roomId: roomId as string,
          messageId: messageId as string,
          roomType: "DIRECT",
        },
        createdAt: Date.now(),
      });
    }

    return messageId;
  },
});
