"use client";

import { startTransition, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn";
import {
  NotificationForMessage,
  NotificationMessage,
} from "./notificationMessage";
import { Id } from "../../../../../convex/_generated/dataModel";
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
  const notificationForMessage: NotificationForMessage = {
    ...notification,
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
        <Avatar>
          <AvatarImage
            src={fromTo === "to" ? userFrom?.imageUrl : userTo?.imageUrl}
            alt={fromTo === "to" ? userFrom?.name : userTo?.name}
          />
          <AvatarFallback>
            {fromTo === "to" ? userFrom?.name : userTo?.name}
          </AvatarFallback>
        </Avatar>

        {userFrom && userTo && (
          <span className="text-lg font-bold text-accent">
            {(fromTo === "to" ? userFrom.name : userTo.name) ?? ""}
          </span>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {formatDateLocalized(new Date(notification.createdAt), {
              dateFormat: "long",
              withDay: true,
              withTime: true,
            })}
            {notification.viewedAt ? (
              <CardDescription>
                {t("notification.viewed", {
                  date: formatDateLocalized(new Date(notification.viewedAt), {
                    dateFormat: "long",
                    withTime: true,
                  }),
                })}
              </CardDescription>
            ) : null}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <NotificationMessage
            notification={notificationForMessage}
            fromTo={fromTo}
          />
        </CardContent>
      </Card>
    </div>
  );
}
