// This file is kept for backwards compatibility but is no longer used.
// Notification formatting is now handled in individual components using Convex notification types.

// Convex notification type (for reference)
export type ConvexNotification = {
  _id: string;
  userId: string;
  userFromId: string;
  type: string;
  message: string;
  data?: unknown;
  viewedAt?: number;
  createdAt: number;
  answeredAt?: number;
  answer?: string;
  linkedNotification?: string;
};
