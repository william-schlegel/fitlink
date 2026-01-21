import { getTranslations } from "next-intl/server";

import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckCircle, Circle } from "lucide-react";

import {
  LayoutPage,
  LayoutPageList,
  LayoutPageMain,
} from "@/components/layoutPage";
import { Button } from "@/components/ui/shadcn";
import {
  getNotificationsForUserInConvex,
  getNotificationTotalCountInConvex,
} from "@/lib/convex/server";
import createLink from "@/lib/createLink";
import { getHref } from "@/lib/getHref";
import { NotificationContent } from "./NotificationContent";

const PER_PAGE = 20;

export default async function ManageNotifications({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{
    mode: "received" | "sent";
    notificationId: string;
    page: number;
  }>;
}) {
  const { userId } = await params;
  const t = await getTranslations("auth");
  const mode = (await searchParams).mode ?? "received";
  const notificationId = (await searchParams).notificationId ?? "";
  const page = (await searchParams).page ?? 0;
  const href = await getHref();

  const count = (await getNotificationTotalCountInConvex(userId)) ?? 0;

  const notificationsData = await getNotificationsForUserInConvex(
    userId,
    mode,
    PER_PAGE,
    page * PER_PAGE,
  );

  const notificationList =
    notificationsData?.notifications.map((notification) => ({
      id: notification._id,
      name: notification.message,
      link: createLink(
        { notificationId: notification._id, page: page.toString(), mode },
        href,
      ),
      badgeIcon: notification.viewedAt ? (
        <CheckCircle className="text-green-500" />
      ) : (
        <Circle className="text-gray-500" />
      ),
    })) ?? [];

  if (
    !notificationId &&
    notificationsData?.notifications &&
    notificationsData.notifications.length > 0
  ) {
    return redirect(
      createLink(
        {
          notificationId: notificationsData.notifications[0]._id,
          page: page.toString(),
          mode,
        },
        href,
      ),
    );
  }

  return (
    <LayoutPage title={t("notification.my-notification", { count })}>
      <LayoutPageMain>
        <LayoutPageList
          list={notificationList}
          itemId={notificationId}
          noItemsText={t("notification.no-notification")}
        >
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              asChild
              variant={mode === "received" ? "default" : "outline"}
            >
              <Link href={createLink({ mode: "received" }, href)}>
                {t("notification.to")}
              </Link>
            </Button>
            <Button asChild variant={mode === "sent" ? "default" : "outline"}>
              <Link href={createLink({ mode: "sent" }, href)}>
                {t("notification.from")}
              </Link>
            </Button>
          </div>
        </LayoutPageList>
        {notificationId ? (
          <NotificationContent
            notificationId={notificationId}
            fromTo={mode === "received" ? "to" : "from"}
          />
        ) : null}
      </LayoutPageMain>
    </LayoutPage>
  );
}
