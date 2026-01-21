import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { NextResponse } from "next/server";

import { getTranslations } from "next-intl/server";

import { getSession } from "@/lib/auth/server";
import {
  createNotificationInConvex,
  getNotificationByIdInConvex,
  updateNotificationInConvex,
} from "@/lib/convex/server";
import { isCUID } from "@/lib/utils";
import { Id } from "../../../../../convex/_generated/dataModel";

type ResponseData = {
  success?: string;
  error?: string;
  step?: string;
  trpcerror?: string;
};

export async function GET(request: Request) {
  const session = await getSession();
  const t = await getTranslations("common");

  const { searchParams } = new URL(request.url);
  const notificationId = searchParams.get("notificationId");

  if (!notificationId || !isCUID(notificationId)) {
    return NextResponse.json<ResponseData>(
      {
        error: t("api.error-with", { error: "invalid notificationId" }),
        step: "notificationId",
      },
      { status: 500 },
    );
  }

  if (!session) {
    return NextResponse.json<ResponseData>(
      { error: t("api.error-with", { error: "unauthorized" }) },
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
          error: t("api.error-with", { error: "notification not found" }),
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
          error: t("api.error-with", { error: "invalid subscriptionId" }),
          step: "subscriptionId",
        },
        { status: 500 },
      );
    }

    // create answer notification
    const answer = await createNotificationInConvex({
      userId: notification.userFromId,
      userFromId: notification.userId,
      type: "SUBSCRIPTION_REJECTED",
      message: t("api.subscription-rejected"),
      linkedNotification: notification._id.toString(),
      data: JSON.stringify(sData),
    });
    // update notification answered
    await updateNotificationInConvex(
      notification._id,
      Date.now(),
      t("api.reject"),
      answer?.toString(),
    );
    return NextResponse.json<ResponseData>(
      { success: t("api.subscription-rejected") },
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
      { error: t("api.error-with", { error: "Unknown error" }) },
      { status: 500 },
    );
  }
}
