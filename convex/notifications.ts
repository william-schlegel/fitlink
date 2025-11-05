import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Queries
export const getNotificationsForUser = query({
  args: {
    userId: v.string(),
    userFromId: v.optional(v.string()),
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const skip = args.skip ?? 0;

    let notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId));

    if (args.userFromId) {
      notificationsQuery = notificationsQuery.filter((q) =>
        q.eq(q.field("userFromId"), args.userFromId),
      );
    }

    if (args.unreadOnly) {
      notificationsQuery = notificationsQuery.filter((q) =>
        q.eq(q.field("viewedAt"), undefined),
      );
    }

    let notifications = await notificationsQuery.order("desc").collect();

    // Get total count before pagination
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.viewedAt).length;

    // Apply pagination
    notifications = notifications.slice(skip, skip + limit);

    return {
      notifications,
      unread,
      total,
    };
  },
});

export const getUnreadCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("viewedAt"), undefined))
      .collect();

    return notifications.length;
  },
});

export const getNotificationById = query({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      return null;
    }

    return notification;
  },
});

// Mutations
export const createNotification = mutation({
  args: {
    userId: v.string(),
    userFromId: v.string(),
    type: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    linkedNotification: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      userFromId: args.userFromId,
      type: args.type,
      message: args.message,
      data: args.data,
      linkedNotification: args.linkedNotification,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

export const createNotifications = mutation({
  args: {
    notifications: v.array(
      v.object({
        userId: v.string(),
        userFromId: v.string(),
        type: v.string(),
        message: v.string(),
        data: v.optional(v.any()),
        linkedNotification: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const notificationIds = await Promise.all(
      args.notifications.map((notification) =>
        ctx.db.insert("notifications", {
          ...notification,
          createdAt: now,
        }),
      ),
    );

    return notificationIds;
  },
});

export const markAsViewed = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, {
      viewedAt: Date.now(),
    });
  },
});

export const getNotificationByIdAndMarkAsViewed = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      return null;
    }

    // Mark as viewed if not already viewed
    if (!notification.viewedAt) {
      await ctx.db.patch(args.notificationId, {
        viewedAt: Date.now(),
      });
      notification.viewedAt = Date.now();
    }

    return notification;
  },
});

export const updateNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    answeredAt: v.optional(v.number()),
    answer: v.optional(v.string()),
    linkedNotification: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    const updates: {
      answeredAt?: number;
      answer?: string;
      linkedNotification?: string;
    } = {};

    if (args.answeredAt !== undefined) {
      updates.answeredAt = args.answeredAt;
    }
    if (args.answer !== undefined) {
      updates.answer = args.answer;
    }
    if (args.linkedNotification !== undefined) {
      updates.linkedNotification = args.linkedNotification;
    }

    await ctx.db.patch(args.notificationId, updates);
  },
});
