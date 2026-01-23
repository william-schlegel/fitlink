import { getTranslations } from "next-intl/server";

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Check,
  CheckCircle,
  Circle,
  CircleQuestionMark,
  Euro,
  HeartHandshake,
  X,
} from "lucide-react";

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
import { Fragment } from "react/jsx-runtime";
import { NotificationContent } from "./NotificationContent";
import { NOTIFICATION_TYPES, NotificationType } from "./types";

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
      name:
        notification.message ||
        t(getName(notification.type as NotificationType)),
      link: createLink(
        { notificationId: notification._id, page: page.toString(), mode },
        href,
      ),
      badgeIcon: getNotificationIcon(
        notification.type as NotificationType,
        notification.answeredAt,
        notification.viewedAt,
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

function getName(type: NotificationType | undefined) {
  if (!type) return "?";
  const nt = NOTIFICATION_TYPES.find((t) => t.value === type);
  return nt?.label ? nt.label : "?";
}

function getNotificationIcon(
  type: NotificationType,
  answeredAt?: number,
  viewedAt?: number,
) {
  const icons: React.ReactNode[] = [];

  if (
    type === "COACH_ACCEPT" ||
    type === "CLUB_ACCEPT" ||
    type === "SUBSCRIPTION_VALIDATED" ||
    type === "REQUEST_VALIDATED"
  )
    icons.push(<HeartHandshake className="text-green-500" />);

  if (
    type === "COACH_REFUSE" ||
    type === "CLUB_REFUSE" ||
    type === "SUBSCRIPTION_REJECTED" ||
    type === "REQUEST_REJECTED"
  )
    icons.push(<X className="text-destructive" />);

  if (type === "SEARCH_COACH" || type === "SEARCH_CLUB")
    icons.push(<CircleQuestionMark className="text-accent" />);

  if (type === "NEW_SUBSCRIPTION")
    icons.push(<Euro className=" text-accent" />);

  if (answeredAt) icons.push(<Check className="text-green-500" />);

  icons.push(
    viewedAt ? (
      <CheckCircle className="text-green-500" />
    ) : (
      <Circle className="text-gray-500" />
    ),
  );

  return icons.map((icon, idx) => (
    <Fragment key={"icon-" + idx}>{icon}</Fragment>
  ));
}
