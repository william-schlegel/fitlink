import { NextResponse } from "next/server";

import { getHTTPStatusCodeFromError } from "@trpc/server/unstable-core-do-not-import";
import { TRPCError } from "@trpc/server";

import { getTranslations } from "next-intl/server";

import {
  createNotificationInConvex,
  getNotificationByIdInConvex,
  updateNotificationInConvex,
} from "@/lib/convex/server";
import { Id } from "../../../../../convex/_generated/dataModel";
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
  const t = await getTranslations("common");

  if (!caller) {
    return NextResponse.json<ResponseData>(
      { error: t("api.error") },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const notificationId = searchParams.get("notificationId");

  if (!notificationId || !isCUID(notificationId)) {
    return NextResponse.json<ResponseData>(
      {
        error: t("api.error-validate-subscription"),
        step: "notificationId",
      },
      { status: 500 },
    );
  }

  if (!session) {
    return NextResponse.json<ResponseData>(
      { error: t("api.error") },
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
          error: t("api.error-validate-subscription"),
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
          error: t("api.error-validate-subscription"),
          step: "subscriptionId",
        },
        { status: 500 },
      );
    }
    const userId = notification.userFromId;
    const subscriptionId = sData.subscriptionId;
    await caller.users.validateSubscription({ userId, subscriptionId });

    // create answer notification
    const answer = await createNotificationInConvex({
      userId: notification.userFromId,
      userFromId: notification.userId,
      type: "SUBSCRIPTION_VALIDATED",
      message: "",
      linkedNotification: notification._id.toString(),
      data: JSON.stringify(sData),
      createdAt: Date.now(),
    });
    // update notification answered
    await updateNotificationInConvex(
      notification._id,
      Date.now(),
      t("api.accept"),
      answer?.toString(),
    );
    return NextResponse.json<ResponseData>(
      { success: t("api.subscription-accepted") },
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
      { error: t("api.error") },
      { status: 500 },
    );
  }
}
