"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

import { api } from "../../convex/_generated/api";

type Notification = {
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

function useNotifications(userId: string | undefined | null) {
  const t = useTranslations("common");

  const notificationsData = useQuery(
    api.notifications.getNotificationsForUser,
    userId ? { userId } : "skip",
  );

  const notifications = notificationsData?.notifications ?? [];
  const unread = notificationsData?.unread ?? 0;

  function formatMessage(notification: Notification) {
    if (notification.type === "NEW_SUBSCRIPTION")
      return t("api.new-subscription");
    if (notification.type === "SUBSCRIPTION_VALIDATED")
      return t("api.subscription-accepted");
    if (notification.type === "SUBSCRIPTION_REJECTED")
      return t("api.subscription-rejected");
    return notification.message;
  }

  return {
    isLoading: notificationsData === undefined,
    notifications,
    unread,
    formatMessage,
  };
}
export default useNotifications;
