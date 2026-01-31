"use server";

import { TRPCError } from "@trpc/server";
import { getTranslations } from "next-intl/server";

import { getSession } from "@/lib/auth/server";
import {
  createNotificationInConvex,
  getNotificationByIdInConvex,
  updateNotificationInConvex,
} from "@/lib/convex/server";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { isCUID } from "@/lib/utils";
import { Id } from "../../convex/_generated/dataModel";

export type NotificationActionState = {
  success?: string;
  error?: string;
  step?: string;
  trpcerror?: string;
};

function readNotificationId(formData: FormData) {
  const value = formData.get("notificationId");
  return typeof value === "string" ? value : undefined;
}

export async function acceptSearchCoachAction(
  _prevState: NotificationActionState | null,
  formData: FormData,
): Promise<NotificationActionState> {
  const session = await getSession();
  const caller = await createTrpcCaller();
  const t = await getTranslations("common");

  if (!caller) {
    return { error: t("api.error-with", { error: "cannot create caller" }) };
  }

  const notificationId = readNotificationId(formData);

  if (!notificationId || !isCUID(notificationId)) {
    return {
      error: t("api.error-with", { error: "invalid notificationId" }),
      step: "notificationId",
    };
  }
  if (!session) {
    return { error: t("api.error-with", { error: "unauthorized" }) };
  }

  try {
    const notification = await getNotificationByIdInConvex(
      notificationId as Id<"notifications">,
    );
    if (!notification) {
      return {
        error: t("api.error-with", { error: "notification not found" }),
        step: "notification",
      };
    }
    const { clubId } = notification.data as {
      clubId: string;
      coachDataId: string;
    };
    if (!isCUID(clubId)) {
      return {
        error: t("api.error-with", { error: "invalid clubId" }),
        step: "clubId - coachDataId",
      };
    }
    const updated = await caller.clubs.updateClubCoach({
      clubId,
      coachUserId: notification.userId,
      managerUserId: notification.userFromId,
    });
    if (updated) {
      const answer = await createNotificationInConvex({
        userId: notification.userFromId,
        userFromId: notification.userId,
        type: "COACH_ACCEPT",
        message: notification.message,
        data: notification._id.toString(),
        linkedNotification: notification._id.toString(),
      });

      await updateNotificationInConvex(
        notificationId as Id<"notifications">,
        Date.now(),
        t("api.accept"),
        answer?.toString() ?? undefined,
      );
    }
    return { success: t("api.accept") };
  } catch (e) {
    if (e instanceof TRPCError) {
      return { trpcerror: e.message, error: e.message };
    }
    return { error: t("api.error-with", { error: "Unknown error" }) };
  }
}

export async function refuseSearchCoachAction(
  _prevState: NotificationActionState | null,
  formData: FormData,
): Promise<NotificationActionState> {
  const session = await getSession();
  const t = await getTranslations("common");

  const notificationId = readNotificationId(formData);

  if (!notificationId || !isCUID(notificationId)) {
    return {
      error: t("api.error-with", { error: "invalid notificationId" }),
      step: "notificationId",
    };
  }

  if (!session) {
    return { error: t("api.error-with", { error: "unauthorized" }) };
  }

  try {
    const notification = await getNotificationByIdInConvex(
      notificationId as Id<"notifications">,
    );
    if (!notification) {
      return {
        error: t("api.error-with", { error: "notification not found" }),
        step: "notification",
      };
    }
    const answer = await createNotificationInConvex({
      userId: notification.userFromId,
      userFromId: notification.userId,
      type: "COACH_REFUSE",
      message: notification.message,
      linkedNotification: notification._id.toString(),
    });
    await updateNotificationInConvex(
      notification._id,
      Date.now(),
      t("api.refused"),
      answer?.toString(),
    );
    return { success: t("api.refused") };
  } catch {
    return { error: t("api.error-with", { error: "Unknown error" }) };
  }
}

export async function cancelSubscriptionAction(
  _prevState: NotificationActionState | null,
  formData: FormData,
): Promise<NotificationActionState> {
  const session = await getSession();
  const t = await getTranslations("common");

  const notificationId = readNotificationId(formData);

  if (!notificationId || !isCUID(notificationId)) {
    return {
      error: t("api.error-with", { error: "invalid notificationId" }),
      step: "notificationId",
    };
  }

  if (!session) {
    return { error: t("api.error-with", { error: "unauthorized" }) };
  }

  try {
    const notification = await getNotificationByIdInConvex(
      notificationId as Id<"notifications">,
    );
    if (!notification) {
      return {
        error: t("api.error-with", { error: "notification not found" }),
        step: "notification",
      };
    }
    const sData = notification.data as {
      subscriptionId: string;
      monthly: boolean;
      online: boolean;
    };
    if (!isCUID(sData.subscriptionId)) {
      return {
        error: t("api.error-with", { error: "invalid subscriptionId" }),
        step: "subscriptionId",
      };
    }

    const answer = await createNotificationInConvex({
      userId: notification.userFromId,
      userFromId: notification.userId,
      type: "SUBSCRIPTION_REJECTED",
      message: t("api.subscription-rejected"),
      linkedNotification: notification._id.toString(),
      data: JSON.stringify(sData),
    });
    await updateNotificationInConvex(
      notification._id,
      Date.now(),
      t("api.reject"),
      answer?.toString(),
    );
    return { success: t("api.subscription-rejected") };
  } catch (e) {
    if (e instanceof TRPCError) {
      return { trpcerror: e.message, error: e.message };
    }
    return { error: t("api.error-with", { error: "Unknown error" }) };
  }
}

export async function validateSubscriptionAction(
  _prevState: NotificationActionState | null,
  formData: FormData,
): Promise<NotificationActionState> {
  const session = await getSession();
  const caller = await createTrpcCaller();
  const t = await getTranslations("common");

  if (!caller) {
    return { error: t("api.error") };
  }

  const notificationId = readNotificationId(formData);

  if (!notificationId || !isCUID(notificationId)) {
    return {
      error: t("api.error-validate-subscription"),
      step: "notificationId",
    };
  }

  if (!session) {
    return { error: t("api.error") };
  }

  try {
    const notification = await getNotificationByIdInConvex(
      notificationId as Id<"notifications">,
    );
    if (!notification) {
      return {
        error: t("api.error-validate-subscription"),
        step: "notification",
      };
    }
    const sData = notification.data as {
      subscriptionId: string;
      monthly: boolean;
      online: boolean;
    };
    if (!isCUID(sData.subscriptionId)) {
      return {
        error: t("api.error-validate-subscription"),
        step: "subscriptionId",
      };
    }
    const userId = notification.userFromId;
    const subscriptionId = sData.subscriptionId;
    await caller.users.validateSubscription({ userId, subscriptionId });

    const answer = await createNotificationInConvex({
      userId: notification.userFromId,
      userFromId: notification.userId,
      type: "SUBSCRIPTION_VALIDATED",
      message: "",
      linkedNotification: notification._id.toString(),
      data: JSON.stringify(sData),
    });
    await updateNotificationInConvex(
      notification._id,
      Date.now(),
      t("api.accept"),
      answer?.toString(),
    );
    return { success: t("api.subscription-accepted") };
  } catch (e) {
    if (e instanceof TRPCError) {
      return { trpcerror: e.message, error: e.message };
    }
    return { error: t("api.error") };
  }
}
