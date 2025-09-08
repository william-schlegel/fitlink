import { userNotification } from "@/db/schema/user";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { isCUID } from "./utils";
import { trpc } from "./trpc/client";

type UserNotification = typeof userNotification.$inferSelect;

function useNotifications(userId: string | undefined | null) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const t = useTranslations("common");

  const getNotifications = trpc.notifications.getNotificationToUser.useQuery(
    { userToId: userId ?? "" },
    {
      enabled: isCUID(userId),
      refetchInterval: 1 * 60 * 1000, // 1'
    }
  );

  useEffect(() => {
    if (getNotifications.data) {
      setNotifications(getNotifications.data.notifications);
      setUnread(getNotifications.data.unread);
    }
  }, [getNotifications.data]);

  function formatMessage(notification: UserNotification) {
    if (notification.type === "NEW_SUBSCRIPTION")
      return t("api.new-subscription");
    if (notification.type === "SUBSCRIPTION_VALIDATED")
      return t("api.subscription-accepted");
    if (notification.type === "SUBSCRIPTION_REJECTED")
      return t("api.subscription-rejected");
    return notification.message;
  }

  return {
    isLoading: getNotifications.isLoading,
    notifications,
    unread,
    formatMessage,
  };
}
export default useNotifications;
