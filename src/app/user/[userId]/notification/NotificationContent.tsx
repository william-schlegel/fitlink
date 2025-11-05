"use client";

import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Id } from "../../../../../convex/_generated/dataModel";
import { NotificationMessage } from "./notificationMessage";
import { api } from "../../../../../convex/_generated/api";
import { formatDateLocalized } from "@/lib/formatDate";
import { FromTo } from "./types";

type NotificationContentProps = {
  notificationId: string;
  fromTo: FromTo;
  userId: string;
};

export function NotificationContent({
  notificationId,
  fromTo,
  userId,
}: NotificationContentProps) {
  const t = useTranslations("auth");
  const markAsViewed = useMutation(api.notifications.markAsViewed);

  const notification = useQuery(
    api.notifications.getNotificationById,
    notificationId
      ? {
          notificationId: notificationId as Id<"notifications">,
        }
      : "skip",
  );

  // Mark as viewed when component mounts
  useEffect(() => {
    if (notification && !notification.viewedAt && notificationId) {
      markAsViewed({
        notificationId: notificationId as Id<"notifications">,
      }).catch(console.error);
    }
  }, [notification, notificationId, markAsViewed]);

  if (!notification) {
    return null;
  }

  // Fetch user info separately - we'll need to add a helper for this
  // For now, using placeholders
  const userFrom = { name: "", imageUrl: "/images/dummy.jpg" };
  const userTo = { name: "", imageUrl: "/images/dummy.jpg" };

  // Convert Convex notification to the format expected by NotificationMessage
  const notificationForMessage = {
    id: notification._id,
    type: notification.type as any,
    message: notification.message,
    viewDate: notification.viewedAt ? new Date(notification.viewedAt) : null,
    date: new Date(notification.createdAt),
    data: notification.data,
    answered: notification.answeredAt
      ? new Date(notification.answeredAt)
      : null,
    answer: notification.answer ?? null,
    linkedNotification: notification.linkedNotification ?? null,
    userFromId: notification.userFromId,
    userToId: notification.userId,
    userFrom,
    userTo,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span>
          {fromTo === "from"
            ? t("notification.from-user")
            : t("notification.to-user")}
        </span>
        <div className="avatar">
          <div className="w-16 rounded">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                (fromTo === "to" ? userFrom.imageUrl : userTo.imageUrl) ??
                "/images/dummy.jpg"
              }
              alt={(fromTo === "to" ? userFrom.name : userTo.name) ?? ""}
            />
          </div>
        </div>
        <span className="text-lg font-bold text-secondary">
          {(fromTo === "to" ? userFrom.name : userTo.name) ?? ""}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <h2>
          {formatDateLocalized(new Date(notification.createdAt), {
            dateFormat: "long",
            withDay: true,
            withTime: true,
          })}
        </h2>
        {notification.viewedAt ? (
          <span>
            {t("notification.viewed", {
              date: formatDateLocalized(new Date(notification.viewedAt), {
                dateFormat: "long",
                withTime: true,
              }),
            })}
          </span>
        ) : null}
      </div>
      <div className="space-y-4 rounded border border-primary p-4">
        <NotificationMessage
          notification={notificationForMessage as any}
          fromTo={fromTo}
        />
      </div>
    </div>
  );
}
