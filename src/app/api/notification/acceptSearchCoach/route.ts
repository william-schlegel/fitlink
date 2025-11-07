import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";

import { Id } from "../../../../../convex/_generated/dataModel";

import {
  createNotificationInConvex,
  getNotificationByIdInConvex,
  updateNotificationInConvex,
} from "@/lib/convex/server";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getSession } from "@/lib/auth/server";
import { isCUID } from "@/lib/utils";

type ResponseData = {
  success?: string;
  error?: string;
  step?: string;
  trpcerror?: string;
};

export async function GET(request: Request) {
  const session = await getSession();
  const caller = await createTrpcCaller();
  if (!caller) {
    return NextResponse.json<ResponseData>(
      { error: "cannot create caller" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const notificationId = searchParams.get("notificationId");

  if (!notificationId || !isCUID(notificationId)) {
    return NextResponse.json<ResponseData>(
      {
        error: "invalid notificationId",
        step: "notificationId",
      },
      { status: 500 },
    );
  }

  if (!session) {
    return NextResponse.json<ResponseData>(
      { error: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    const notification = await getNotificationByIdInConvex(
      notificationId as Id<"notifications">,
    );
    if (!notification) {
      return NextResponse.json<ResponseData>(
        {
          error: "notification not found",
          step: "notification",
        },
        { status: 500 },
      );
    }
    const { clubId } = notification.data as {
      clubId: string;
      coachDataId: string;
    };
    if (!isCUID(clubId)) {
      return NextResponse.json<ResponseData>(
        {
          error: "invalid clubId",
          step: "clubId - coachDataId",
        },
        { status: 500 },
      );
    }
    const updated = await caller.clubs.updateClubCoach({
      clubId,
      coachUserId: notification.userId,
      managerId: notification.userFromId,
    });
    if (updated) {
      // create answer notification
      const answer = await createNotificationInConvex({
        userId: notification.userId,
        userFromId: notification.userFromId,
        type: "COACH_ACCEPT",
        message: notification.message,
        data: notification._id.toString(),
        linkedNotification: notification._id.toString(),
      });

      await updateNotificationInConvex(
        notificationId as Id<"notifications">,
        Date.now(),
        "Demande acceptée",
        answer?.toString() ?? undefined,
      );
    }
    return NextResponse.json<ResponseData>(
      { success: "Demande acceptée" },
      { status: 200 },
    );
  } catch (e) {
    if (e instanceof TRPCError) {
      // We can get the specific HTTP status code coming from tRPC (e.g. 404 for `NOT_FOUND`).
      const httpStatusCode = getHTTPStatusCodeFromError(e);

      return NextResponse.json<ResponseData>(
        { trpcerror: e.message },
        { status: httpStatusCode },
      );
    }
    return NextResponse.json<ResponseData>(
      { error: "Unknown error" },
      { status: 500 },
    );
  }
}
