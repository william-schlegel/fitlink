import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
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
    console.warn("CONVEX_URL not set, skipping Convex room creation");
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
    console.warn("CONVEX_URL not set, skipping Convex room creation");
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
    console.warn("CONVEX_URL not set, skipping Convex member addition");
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
    console.warn("CONVEX_URL not set, skipping Convex DM room creation");
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
