import { getTranslations } from "next-intl/server";

import { userNotification } from "@/db/schema/user";

type UserNotification = typeof userNotification.$inferSelect;

export async function formatMessage(notification: UserNotification) {
  const t = await getTranslations("common");
  if (notification.type === "NEW_SUBSCRIPTION")
    return t("api.new-subscription");
  if (notification.type === "SUBSCRIPTION_VALIDATED")
    return t("api.subscription-accepted");
  if (notification.type === "SUBSCRIPTION_REJECTED")
    return t("api.subscription-rejected");
  return notification.message;
}
