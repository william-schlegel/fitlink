import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper mutation to create a room (used by actions)
export const createRoom = mutation({
  args: {
    type: v.union(v.literal("CLUB"), v.literal("COACH"), v.literal("DIRECT")),
    clubId: v.optional(v.string()),
    coachId: v.optional(v.string()),
    userIds: v.optional(v.array(v.string())),
    name: v.string(),
    createdByUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatRooms", {
      type: args.type,
      clubId: args.clubId,
      coachId: args.coachId,
      userIds: args.userIds,
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

// Helper mutation to add room member (used by actions)
export const addRoomMember = mutation({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.string(),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("roomMembers", {
      roomId: args.roomId,
      userId: args.userId,
      isAdmin: args.isAdmin,
      isBanned: false,
      joinedAt: Date.now(),
    });
  },
});

// Helper query to get room member (used by actions)
export const getRoomMember = query({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId),
      )
      .first();
  },
});

// Helper query to find direct room (used by actions)
export const findDirectRoom = query({
  args: {
    userId1: v.string(),
    userId2: v.string(),
  },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("chatRooms")
      .withIndex("by_type", (q) => q.eq("type", "DIRECT"))
      .collect();

    return rooms.find(
      (room) =>
        room.userIds?.includes(args.userId1) &&
        room.userIds?.includes(args.userId2),
    );
  },
});

// Ban user from a room
export const banUserFromRoom = mutation({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.string(),
    bannedBy: v.string(),
    reason: v.optional(v.string()),
    banDuration: v.optional(v.number()), // Duration in milliseconds
  },
  handler: async (ctx, args) => {
    // Check if the person banning is an admin
    const bannerMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.bannedBy),
      )
      .first();

    if (!bannerMembership || !bannerMembership.isAdmin) {
      throw new Error("Only admins can ban users");
    }

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this room");
    }

    const bannedUntil = args.banDuration
      ? Date.now() + args.banDuration
      : undefined;

    await ctx.db.patch(membership._id, {
      isBanned: true,
      bannedUntil,
    });
  },
});

// Unban user from a room
export const unbanUserFromRoom = mutation({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.string(),
    unbannedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the person unbanning is an admin
    const unbannerMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.unbannedBy),
      )
      .first();

    if (!unbannerMembership || !unbannerMembership.isAdmin) {
      throw new Error("Only admins can unban users");
    }

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
      isBanned: false,
      bannedUntil: undefined,
    });
  },
});

// Admin: Ban user globally
export const adminBanUser = mutation({
  args: {
    userId: v.string(),
    bannedBy: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Note: In a real implementation, you'd check if bannedBy is an admin
    // For now, we'll trust that this is called from an admin context

    // Check if already banned
    const existing = await ctx.db
      .query("bannedUsers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      throw new Error("User is already banned");
    }

    await ctx.db.insert("bannedUsers", {
      userId: args.userId,
      bannedBy: args.bannedBy,
      reason: args.reason,
      bannedAt: Date.now(),
    });
  },
});

// Admin: Unban user globally
export const adminUnbanUser = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const ban = await ctx.db
      .query("bannedUsers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!ban) {
      throw new Error("User is not banned");
    }

    await ctx.db.delete(ban._id);
  },
});

// Check if user can moderate (admin or room admin)
export const canModerate = query({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.string(),
    isAppAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    // App admins can always moderate
    if (args.isAppAdmin) {
      return true;
    }

    // Check if user is room admin
    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_roomId_userId", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId),
      )
      .first();

    return membership?.isAdmin ?? false;
  },
});

