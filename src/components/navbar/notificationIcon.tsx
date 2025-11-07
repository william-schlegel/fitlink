"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";

type NotificationIconProps = {
  userId: string;
};

function formatMessage(
  t: ReturnType<typeof useTranslations>,
  notification: {
    type: string;
    message: string;
    data?: unknown;
  },
) {
  if (notification.type === "NEW_SUBSCRIPTION")
    return t("common.api.new-subscription");
  if (notification.type === "SUBSCRIPTION_VALIDATED")
    return t("common.api.subscription-accepted");
  if (notification.type === "SUBSCRIPTION_REJECTED")
    return t("common.api.subscription-rejected");
  if (notification.type === "NEW_MESSAGE") {
    const data = notification.data as
      | { roomId?: string; roomType?: string }
      | undefined;
    if (data?.roomType === "DIRECT") {
      return t("common.api.new-message");
    }
    return notification.message;
  }
  return notification.message;
}

export default function NotificationIcon({ userId }: NotificationIconProps) {
  const t = useTranslations();
  const notificationsData = useQuery(
    api.notifications.getNotificationsForUser,
    {
      userId,
      limit: 10,
      skip: 0,
    },
  );

  const notifications = notificationsData?.notifications ?? [];
  const unread = notificationsData?.unread ?? 0;

  if (!notifications.length) {
    return <i className="bx bx-bell bx-md text-base-300" />;
  }

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn-ghost btn-circle btn">
        <div className="w-10 rounded-full">
          {unread ? (
            <div className="indicator ">
              <i className="bx bx-bell bx-md text-primary" />
              <span className="badge-secondary badge badge-sm indicator-item">
                {unread}
              </span>
            </div>
          ) : (
            <i className="bx bx-bell bx-md text-primary" />
          )}
        </div>
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-base-100 p-2 shadow"
      >
        {notifications.map((notification) => {
          const data = notification.data as { roomId?: string } | undefined;
          const href =
            notification.type === "NEW_MESSAGE" && data?.roomId
              ? `/chat?roomId=${data.roomId}`
              : `/user/${notification.userId}/notification?notificationId=${notification._id}`;

          return (
            <li
              key={notification._id}
              className={`max-w-full overflow-hidden truncate text-ellipsis ${
                notification.viewedAt ? "" : "font-bold text-secondary"
              }`}
            >
              <Link href={href}>
                <span>{formatMessage(t, notification)}</span>
              </Link>
            </li>
          );
        })}
        <div className="divider my-1"></div>
        <li>
          <Link href={`/user/${userId}/notification`}>
            <span>{t("common.navigation.my-notifications")}</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
