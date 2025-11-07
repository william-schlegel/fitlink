import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";

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
        error: "common:api.error-cancel-subscription",
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
          error: "common:api.error-cancel-subscription",
          step: "notification",
        },
        { status: 500 },
      );
    }
    const sData = notification.data as {
      subscriptionId: string;
      monthly: boolean;
      online: boolean;
    };
    if (!isCUID(sData.subscriptionId)) {
      return NextResponse.json<ResponseData>(
        {
          error: "common:api.error-cancel-subscription",
          step: "subscriptionId",
        },
        { status: 500 },
      );
    }

    // create answer notification
    const answer = await createNotificationInConvex({
      userId: notification.userId,
      userFromId: notification.userFromId,
      type: "SUBSCRIPTION_REJECTED",
      message: "",
      linkedNotification: notification._id.toString(),
      data: JSON.stringify(sData),
    });
    // update notification answered
    await updateNotificationInConvex(
      notification._id,
      Date.now(),
      "common:api.reject",
      answer?.toString(),
    );
    return NextResponse.json<ResponseData>(
      { success: "common:api.subscription-rejected" },
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
      { error: "common:api.error" },
      { status: 500 },
    );
  }
}
