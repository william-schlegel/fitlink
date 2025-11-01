import { action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const createClubRoom = action({
  args: {
    clubId: v.string(),
    clubName: v.string(),
    managerId: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"chatRooms">> => {
    const roomId = await ctx.runMutation(api.moderation.createRoom, {
      type: "CLUB",
      clubId: args.clubId,
      name: args.clubName,
      createdByUserId: args.managerId,
    });

    // Add manager as admin
    await ctx.runMutation(api.moderation.addRoomMember, {
      roomId,
      userId: args.managerId,
      isAdmin: true,
    });

    return roomId;
  },
});

export const createCoachRoom = action({
  args: {
    coachId: v.string(),
    coachName: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"chatRooms">> => {
    const roomId = await ctx.runMutation(api.moderation.createRoom, {
      type: "COACH",
      coachId: args.coachId,
      name: args.coachName,
      createdByUserId: args.coachId,
    });

    // Add coach as admin
    await ctx.runMutation(api.moderation.addRoomMember, {
      roomId,
      userId: args.coachId,
      isAdmin: true,
    });

    return roomId;
  },
});

export const addMemberToClubRoom = action({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"roomMembers">> => {
    // Check if user is already a member
    const existing = await ctx.runQuery(api.moderation.getRoomMember, {
      roomId: args.roomId,
      userId: args.userId,
    });

    if (existing) {
      return existing._id;
    }

    return await ctx.runMutation(api.moderation.addRoomMember, {
      roomId: args.roomId,
      userId: args.userId,
      isAdmin: false,
    });
  },
});

export const createDirectMessageRoom = action({
  args: {
    userId1: v.string(),
    userId2: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"chatRooms">> => {
    // Check if room already exists
    const existing = await ctx.runQuery(api.moderation.findDirectRoom, {
      userId1: args.userId1,
      userId2: args.userId2,
    });

    if (existing) {
      return existing._id;
    }

    // Create new direct message room
    const roomId = await ctx.runMutation(api.moderation.createRoom, {
      type: "DIRECT",
      userIds: [args.userId1, args.userId2],
      name: "", // Direct messages don't need a name
      createdByUserId: args.userId1,
    });

    // Add both users as members
    await ctx.runMutation(api.moderation.addRoomMember, {
      roomId,
      userId: args.userId1,
      isAdmin: false,
    });

    await ctx.runMutation(api.moderation.addRoomMember, {
      roomId,
      userId: args.userId2,
      isAdmin: false,
    });

    return roomId;
  },
});
