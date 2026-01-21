import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Create a new assistant session
export const createSession = mutation({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("assistantSessions", {
      userId: args.userId,
      createdAt: Date.now(),
    });
    return sessionId;
  },
});

// Get or create a session for a user
export const getOrCreateSession = mutation({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If userId is provided, try to find an existing session
    if (args.userId) {
      const existingSession = await ctx.db
        .query("assistantSessions")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .first();

      if (existingSession) {
        return existingSession._id;
      }
    }

    // Create a new session
    const sessionId = await ctx.db.insert("assistantSessions", {
      userId: args.userId,
      createdAt: Date.now(),
    });
    return sessionId;
  },
});

// Get a session by ID
export const getSession = query({
  args: {
    sessionId: v.id("assistantSessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

// Add a message to a session
export const addMessage = mutation({
  args: {
    sessionId: v.id("assistantSessions"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    content: v.string(),
    toolCalls: v.optional(v.any()),
    results: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("assistantMessages", {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      toolCalls: args.toolCalls,
      results: args.results,
      createdAt: Date.now(),
    });
    return messageId;
  },
});

// Get all messages for a session (ordered by creation time)
export const getMessages = query({
  args: {
    sessionId: v.id("assistantSessions"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("assistantMessages")
      .withIndex("by_sessionId_createdAt", (q) =>
        q.eq("sessionId", args.sessionId),
      )
      .order("asc")
      .collect();
    return messages;
  },
});

// Get recent messages for a session (for context window)
export const getRecentMessages = query({
  args: {
    sessionId: v.id("assistantSessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const messages = await ctx.db
      .query("assistantMessages")
      .withIndex("by_sessionId_createdAt", (q) =>
        q.eq("sessionId", args.sessionId),
      )
      .order("desc")
      .take(limit);
    // Reverse to get chronological order
    return messages.reverse();
  },
});

// Delete a session and all its messages
export const deleteSession = mutation({
  args: {
    sessionId: v.id("assistantSessions"),
  },
  handler: async (ctx, args) => {
    // Delete all messages for this session
    const messages = await ctx.db
      .query("assistantMessages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the session
    await ctx.db.delete(args.sessionId);
  },
});

// Get user's recent sessions
export const getUserSessions = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const sessions = await ctx.db
      .query("assistantSessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    return sessions;
  },
});
