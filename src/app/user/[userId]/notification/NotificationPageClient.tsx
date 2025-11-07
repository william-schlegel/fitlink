"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { useEffect } from "react";

import { NotificationContent } from "./NotificationContent";
import { api } from "../../../../../convex/_generated/api";
import { NotificationList } from "./NotificationList";
import createLink from "@/lib/createLink";
import { FromTo } from "./types";

const PER_PAGE = 20;

type NotificationPageClientProps = {
  userId: string;
};

export function NotificationPageClient({
  userId,
}: NotificationPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromTo = (searchParams.get("fromTo") ?? "to") as FromTo;
  const notificationId = searchParams.get("notificationId") ?? "";
  const page = parseInt(searchParams.get("page") ?? "0", 10);

  const notificationsData = useQuery(
    api.notifications.getNotificationsForUser,
    {
      userId,
      userFromId: fromTo === "from" ? userId : undefined,
      limit: PER_PAGE,
      skip: page * PER_PAGE,
    },
  );

  // Redirect to first notification if none selected
  useEffect(() => {
    if (
      notificationsData &&
      notificationsData.notifications.length > 0 &&
      !notificationId
    )
      router.push(
        createLink(
          {
            notificationId: notificationsData.notifications[0]?._id ?? "",
            page: page.toString(),
            fromTo,
          },
          null,
          pathname,
        ),
      );
  }, [notificationsData, notificationId, page, fromTo, router, pathname]);

  return (
    <div className="flex gap-4">
      <NotificationList
        userId={userId}
        fromTo={fromTo}
        notificationId={notificationId}
        page={page}
      />
      {notificationId ? (
        <NotificationContent notificationId={notificationId} fromTo={fromTo} />
      ) : null}
    </div>
  );
}
