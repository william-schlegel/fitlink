import { NextResponse } from "next/server";

import {
  createNotificationInConvex,
  getNotificationByIdInConvex,
  updateNotificationInConvex,
} from "@/lib/convex/server";
import { Id } from "../../../../../convex/_generated/dataModel";
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

  const { searchParams } = new URL(request.url);
  const notificationId = searchParams.get("notificationId");

  if (!notificationId || !isCUID(notificationId)) {
    return NextResponse.json<ResponseData>(
      {
        error: "common:api.error-refuse-search-coach",
        step: "notificationId",
      },
      { status: 500 },
    );
  }

  if (!session) {
    return NextResponse.json<ResponseData>(
      { error: "common:api.error" },
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
          error: "common:api.error-refuse-search-coach",
          step: "notification",
        },
        { status: 500 },
      );
    }
    // create answer notification
    const answer = await createNotificationInConvex({
      userId: notification.userId,
      userFromId: notification.userFromId,
      type: "COACH_REFUSE",
      message: ">".concat(notification.message.slice(0, 15), "..."),
      linkedNotification: notification._id.toString(),
    });
    // update notification answered
    await updateNotificationInConvex(
      notification._id,
      Date.now(),
      "common:api.refused",
      answer?.toString(),
    );
    return NextResponse.json<ResponseData>(
      { success: "common:api.answer-sent" },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json<ResponseData>(
      { error: "common:api.error" },
      { status: 500 },
    );
  }
}
