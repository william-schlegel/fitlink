import Title from "@/components/title";
import Pagination from "@/components/ui/pagination";
import createLink from "@/lib/createLink";
import { formatDateLocalized } from "@/lib/formatDate";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { FromTo } from "./types";
import { NotificationMessage } from "./notificationMessage";
import {
  getNotificationById,
  getNotificationToUser,
} from "@/server/api/routers/notification";

const PER_PAGE = 20;

export default async function ManageNotifications({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{
    fromTo: FromTo;
    notificationId: string;
    page: string;
  }>;
}) {
  const { userId } = await params;
  const { fromTo, notificationId, page } = await searchParams;

  const notificationQuery = await getNotificationToUser(
    fromTo === "to" ? userId : undefined,
    fromTo === "from" ? userId : undefined,
    parseInt(page, 10) * PER_PAGE,
    PER_PAGE
  );

  const headerList = await headers();
  const href = headerList.get("x-current-href");

  if (notificationQuery.notifications.length > 0 && !notificationId) {
    redirect(
      createLink(
        {
          notificationId: notificationQuery.notifications[0]?.id,
          page: page.toString(),
        },
        href
      )
    );
  }

  const t = await getTranslations("auth");

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title
        title={t("notification.my-notification", {
          count: notificationQuery?.notifications.length ?? 0,
        })}
      />
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>
          {t("notification.my-notification", {
            count: notificationQuery?.notifications.length ?? 0,
          })}
        </h1>
      </div>
      <div className="flex gap-4">
        <div className="w-1/4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Link
              className={`btn-primary btn ${
                fromTo === "to" ? "" : "btn-outline"
              }`}
              href={createLink(
                {
                  notificationId: "",
                  page: "0",
                  fromTo: "to",
                },
                href
              )}
            >
              {t("notification.to")}
            </Link>
            <Link
              className={`btn-primary btn ${
                fromTo === "from" ? "" : "btn-outline"
              }`}
              href={createLink(
                {
                  notificationId: "",
                  page: "0",
                  fromTo: "from",
                },
                href
              )}
            >
              {t("notification.from")}
            </Link>
          </div>
          <ul className="menu w-full overflow-hidden rounded bg-base-100">
            {notificationQuery?.notifications.map((notification) => (
              <li key={notification.id}>
                <Link
                  href={createLink({
                    notificationId: notification.id,
                    page: page.toString(),
                    fromTo,
                  })}
                  className={twMerge(
                    "flex items-center justify-between",
                    notificationId === notification.id && "badge badge-primary",
                    !notification.viewDate && "font-bold text-secondary"
                  )}
                >
                  <div>
                    {formatDateLocalized(notification.date, {
                      dateFormat: "short",
                      withTime: true,
                    })}
                  </div>
                  <div className="space-x-2">
                    {notification.type === "COACH_ACCEPT" ||
                    notification.type === "CLUB_ACCEPT" ||
                    notification.type === "SUBSCRIPTION_VALIDATED" ||
                    notification.type === "REQUEST_VALIDATED" ? (
                      <i className="bx bx-happy-heart-eyes bx-xs rounded-full bg-success p-2 text-success-content" />
                    ) : null}
                    {notification.type === "COACH_REFUSE" ||
                    notification.type === "CLUB_REFUSE" ||
                    notification.type === "SUBSCRIPTION_REJECTED" ||
                    notification.type === "REQUEST_REJECTED" ? (
                      <i className="bx bx-x bx-xs rounded-full bg-error p-2 text-error-content" />
                    ) : null}
                    {notification.type === "SEARCH_COACH" ||
                    notification.type === "SEARCH_CLUB" ? (
                      <i className="bx bx-question-mark bx-xs rounded-full bg-secondary p-2 text-secondary-content" />
                    ) : null}
                    {notification.type === "NEW_SUBSCRIPTION" ? (
                      <i className="bx bx-dollar bx-xs rounded-full bg-secondary p-2 text-secondary-content" />
                    ) : null}
                    {notification.answered ? (
                      <i className="bx bx-check bx-xs rounded-full bg-success p-2 text-success-content" />
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            actualPage={parseInt(page, 10)}
            count={notificationQuery?.total ?? 0}
            onPageClick={(page) =>
              redirect(
                createLink(
                  {
                    notificationId: "",
                    page: page.toString(),
                    fromTo,
                  },
                  href
                )
              )
            }
            perPage={PER_PAGE}
          />
        </div>

        {notificationId === "" ? null : (
          <NotificationContent
            notificationId={notificationId}
            fromTo={fromTo}
          />
        )}
      </div>
    </div>
  );
}

type NotificationContentProps = {
  notificationId: string;
  fromTo: FromTo;
};

export async function NotificationContent({
  notificationId,
  fromTo,
}: NotificationContentProps) {
  const notification = await getNotificationById(notificationId, true);
  const t = await getTranslations("auth");

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
                (fromTo === "to"
                  ? notification?.userFrom.imageUrl
                  : notification?.userTo.imageUrl) ?? "/images/dummy.jpg"
              }
              alt={
                (fromTo === "to"
                  ? notification?.userFrom.name
                  : notification?.userTo.name) ?? ""
              }
            />
          </div>
        </div>
        <span className="text-lg font-bold text-secondary">
          {(fromTo === "to"
            ? notification?.userFrom.name
            : notification?.userTo.name) ?? ""}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <h2>
          {formatDateLocalized(notification?.date, {
            dateFormat: "long",
            withDay: true,
            withTime: true,
          })}
        </h2>
        {notification?.viewDate ? (
          <span>
            {t("notification.viewed", {
              date: formatDateLocalized(notification?.viewDate, {
                dateFormat: "long",
                withTime: true,
              }),
            })}
          </span>
        ) : null}
      </div>
      <div className="space-y-4 rounded border border-primary p-4">
        {notification ? (
          <NotificationMessage notification={notification} fromTo={fromTo} />
        ) : null}
      </div>
    </div>
  );
}
