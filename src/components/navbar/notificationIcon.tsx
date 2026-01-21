"use client";

import { useQuery } from "convex/react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { cn } from "@/lib/utils";
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
    return (
      <Button variant="ghost" size="icon" disabled>
        <Bell className="h-5 w-5 text-base-content/30" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-6 text-primary" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {notifications.map((notification) => {
          const data = notification.data as { roomId?: string } | undefined;
          const href =
            notification.type === "NEW_MESSAGE" && data?.roomId
              ? `/chat?roomId=${data.roomId}`
              : `/user/${notification.userId}/notification?notificationId=${notification._id}`;

          return (
            <DropdownMenuItem key={notification._id} asChild>
              <Link href={href}>
                <span
                  className={cn(
                    "line-clamp-2 w-full",
                    !notification.viewedAt && "font-bold text-primary",
                  )}
                >
                  {formatMessage(t, notification)}
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/user/${userId}/notification`}>
            <span>{t("common.navigation.my-notifications")}</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
