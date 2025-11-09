import { ConvexHttpClient } from "convex/browser";

import { Id } from "../../../convex/_generated/dataModel";
import { CreateNotificationInConvexArgs } from "./types";
import { api } from "../../../convex/_generated/api";
import { env } from "@/env";

const convexHttpClient = new ConvexHttpClient(
  env.CONVEX_URL ?? process.env.CONVEX_URL ?? "",
);

export async function createClubRoomInConvex(
  clubId: string,
  clubName: string,
  managerId: string,
) {
  if (!env.CONVEX_URL && !process.env.CONVEX_URL) {
    console.warn("CONVEX_URL not set, skipping Convex club room creation");
    return null;
  }

  try {
    const roomId = await convexHttpClient.action(api.actions.createClubRoom, {
      clubId,
      clubName,
      managerId,
    });
    return roomId.toString();
  } catch (error) {
    console.error("Error creating Convex club room:", error);
    return null;
  }
}

export async function createCoachRoomInConvex(
  coachId: string,
  coachName: string,
) {
  if (!env.CONVEX_URL && !process.env.CONVEX_URL) {
    console.warn("CONVEX_URL not set, skipping Convex coach room creation");
    return null;
  }

  try {
    const roomId = await convexHttpClient.action(api.actions.createCoachRoom, {
      coachId,
      coachName,
    });
    return roomId;
  } catch (error) {
    console.error("Error creating Convex coach room:", error);
    return null;
  }
}

export async function addMemberToClubRoomInConvex(
  roomId: string,
  userId: string,
) {
  if (!env.CONVEX_URL && !process.env.CONVEX_URL) {
    console.warn(
      "CONVEX_URL not set, skipping Convex member addition in club room",
    );
    return null;
  }

  try {
    await convexHttpClient.action(api.actions.addMemberToClubRoom, {
      roomId: roomId as Id<"chatRooms">,
      userId,
    });
    return true;
  } catch (error) {
    console.error("Error adding member to Convex club room:", error);
    return false;
  }
}

export async function getClubRoomId(clubId: string): Promise<string | null> {
  if (!env.CONVEX_URL && !process.env.CONVEX_URL) {
    console.warn("CONVEX_URL not set, skipping Convex club room get");
    return null;
  }

  try {
    const room = await convexHttpClient.query(api.messages.getRoomByClubId, {
      clubId,
    });
    return room ? String(room._id) : null;
  } catch (error) {
    console.error("Error getting club room:", error);
    return null;
  }
}

export async function createDirectMessageRoomInConvex(
  userId1: string,
  userId2: string,
) {
  if (!env.CONVEX_URL && !process.env.CONVEX_URL) {
    console.warn(
      "CONVEX_URL not set, skipping Convex direct message room creation",
    );
    return null;
  }

  try {
    const roomId = await convexHttpClient.action(
      api.actions.createDirectMessageRoom,
      {
        userId1,
        userId2,
      },
    );
    return roomId;
  } catch (error) {
    console.error("Error creating Convex DM room:", error);
    return null;
  }
}

export async function createNotificationInConvex(
  notification: CreateNotificationInConvexArgs,
) {
  if (!env.CONVEX_URL && !process.env.CONVEX_URL) {
    console.warn(
      "CONVEX_URL not set, skipping Convex notification creation in convex",
    );
    return null;
  }

  try {
    const notificationId = await convexHttpClient.mutation(
      api.notifications.createNotification,
      notification,
    );
    return notificationId;
  } catch (error) {
    console.error("Error creating Convex notification:", error);
    return null;
  }
}

export async function createNotificationsInConvex(
  notifications: Array<CreateNotificationInConvexArgs>,
) {
  if (!env.CONVEX_URL && !process.env.CONVEX_URL) {
    console.warn(
      "CONVEX_URL not set, skipping Convex notifications creation in convex",
    );
    return null;
  }

  try {
    const notificationIds = await convexHttpClient.mutation(
      api.notifications.createNotifications,
      { notifications },
    );
    return notificationIds;
  } catch (error) {
    console.error("Error creating Convex notifications:", error);
    return null;
  }
}

export async function updateNotificationInConvex(
  notificationId: Id<"notifications">,
  answeredAt: number,
  answer: string,
  linkedNotification?: string,
) {
  if (!env.CONVEX_URL && !process.env.CONVEX_URL) {
    console.warn(
      "CONVEX_URL not set, skipping Convex notification update in convex",
    );
    return null;
  }
  try {
    await convexHttpClient.mutation(api.notifications.updateNotification, {
      notificationId,
      answeredAt,
      answer,
      linkedNotification,
    });
    return notificationId;
  } catch (error) {
    console.error("Error updating Convex notification:", error);
    return null;
  }
}

export async function getNotificationByIdInConvex(
  notificationId: Id<"notifications">,
) {
  if (!env.CONVEX_URL && !process.env.CONVEX_URL) {
    console.warn(
      "CONVEX_URL not set, skipping Convex notification get in convex",
    );
    return null;
  }
  try {
    const notification = await convexHttpClient.query(
      api.notifications.getNotificationById,
      {
        notificationId,
      },
    );
    return notification;
  } catch (error) {
    console.error("Error getting Convex notification:", error);
    return null;
  }
}
