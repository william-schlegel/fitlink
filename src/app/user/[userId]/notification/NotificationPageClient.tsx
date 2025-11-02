"use client";

import { useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../../../convex/_generated/api";
import { NotificationList } from "./NotificationList";
import { NotificationContent } from "./NotificationContent";
import { FromTo } from "./types";

const PER_PAGE = 20;

type NotificationPageClientProps = {
  userId: string;
};

export function NotificationPageClient({ userId }: NotificationPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTo = (searchParams.get("fromTo") ?? "to") as FromTo;
  const notificationId = searchParams.get("notificationId") ?? "";
  const page = parseInt(searchParams.get("page") ?? "0", 10);

  const notificationsData = useQuery(api.notifications.getNotificationsForUser, {
    userId,
    userFromId: fromTo === "from" ? userId : undefined,
    limit: PER_PAGE,
    skip: page * PER_PAGE,
  });

  // Redirect to first notification if none selected
  useEffect(() => {
    if (
      notificationsData &&
      notificationsData.notifications.length > 0 &&
      !notificationId
    ) {
      const href = window.location.pathname;
      const params = new URLSearchParams(searchParams.toString());
      params.set("notificationId", notificationsData.notifications[0]?._id ?? "");
      params.set("page", page.toString());
      params.set("fromTo", fromTo);
      router.push(`${href}?${params.toString()}`);
    }
  }, [notificationsData, notificationId, page, fromTo, router, searchParams]);

  return (
    <div className="flex gap-4">
      <NotificationList
        userId={userId}
        fromTo={fromTo}
        notificationId={notificationId}
        page={page}
      />
      {notificationId ? (
        <NotificationContent
          notificationId={notificationId}
          fromTo={fromTo}
          userId={userId}
        />
      ) : null}
    </div>
  );
}

