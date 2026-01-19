/**
 * Arguments for creating a notification in Convex.
 * Note: createdAt is NOT included because it's automatically set by the Convex mutation handler.
 */
export type CreateNotificationInConvexArgs = {
  userId: string;
  userFromId: string;
  type: string;
  message: string;
  data?: unknown;
  linkedNotification?: string;
};
