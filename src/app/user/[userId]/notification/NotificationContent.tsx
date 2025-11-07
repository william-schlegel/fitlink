"use client";

import { startTransition, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";

import { Id } from "../../../../../convex/_generated/dataModel";
import { NotificationMessage } from "./notificationMessage";
import { api } from "../../../../../convex/_generated/api";
import { formatDateLocalized } from "@/lib/formatDate";
import { trpc } from "@/lib/trpc/client";
import { FromTo } from "./types";

type NotificationContentProps = {
  notificationId: string;
  fromTo: FromTo;
};

export function NotificationContent({
  notificationId,
  fromTo,
}: NotificationContentProps) {
  const t = useTranslations("auth");
  const markAsViewed = useMutation(api.notifications.markAsViewed);
  const [userFrom, setUserFrom] = useState<{
    name: string;
    imageUrl: string;
  } | null>(null);
  const [userTo, setUserTo] = useState<{
    name: string;
    imageUrl: string;
  } | null>(null);

  const notification = useQuery(
    api.notifications.getNotificationById,
    notificationId
      ? {
          notificationId: notificationId as Id<"notifications">,
        }
      : "skip",
  );
  const fromData = trpc.users.getUserAvatar.useQuery(
    { userId: notification?.userFromId ?? "" },
    { enabled: Boolean(notification?.userFromId) },
  );
  const toData = trpc.users.getUserAvatar.useQuery(
    { userId: notification?.userId ?? "" },
    { enabled: Boolean(notification?.userId) },
  );

  // Mark as viewed when component mounts
  useEffect(() => {
    if (notification && !notification.viewedAt && notificationId) {
      markAsViewed({
        notificationId: notificationId as Id<"notifications">,
      }).catch(console.error);
    }
  }, [notification, notificationId, markAsViewed]);

  useEffect(() => {
    if (!fromData.data) return;
    startTransition(() => {
      setUserFrom(fromData.data);
    });
  }, [fromData.data]);

  useEffect(() => {
    if (!toData.data) return;
    startTransition(() => {
      setUserTo(toData.data);
    });
  }, [toData.data]);

  if (!notification) return null;

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
          <div className="w-16 avatar">
            {userFrom && userTo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fromTo === "to" ? userFrom.imageUrl : userTo.imageUrl}
                alt={fromTo === "to" ? userFrom.name : userTo.name}
                width={64}
                height={64}
                className="rounded-full"
                loading="lazy"
              />
            )}
          </div>
        </div>
        {userFrom && userTo && (
          <span className="text-lg font-bold text-secondary">
            {(fromTo === "to" ? userFrom.name : userTo.name) ?? ""}
          </span>
        )}
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
