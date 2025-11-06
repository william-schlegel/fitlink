"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";
import { useQuery } from "convex/react";
import Link from "next/link";

import { api } from "../../../../../convex/_generated/api";
import { formatDateLocalized } from "@/lib/formatDate";
import Pagination from "@/components/ui/pagination";
import { FromTo } from "./types";

const PER_PAGE = 20;

type NotificationListProps = {
  userId: string;
  fromTo: FromTo;
  notificationId: string;
  page: number;
};

export function NotificationList({
  userId,
  fromTo,
  notificationId,
  page,
}: NotificationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");

  const notificationsData = useQuery(
    api.notifications.getNotificationsForUser,
    {
      userId,
      userFromId: fromTo === "from" ? userId : undefined,
      limit: PER_PAGE,
      skip: page * PER_PAGE,
    },
  );

  const notifications = notificationsData?.notifications ?? [];
  const total = notificationsData?.total ?? 0;

  const createLinkWithParams = (updates: {
    notificationId?: string;
    page?: string;
    fromTo?: FromTo;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.notificationId !== undefined)
      params.set("notificationId", updates.notificationId);
    if (updates.page !== undefined) params.set("page", updates.page);
    if (updates.fromTo !== undefined) params.set("fromTo", updates.fromTo);
    return `${window.location.pathname}?${params.toString()}`;
  };

  return (
    <div className="w-1/4 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Link
          className={`btn-primary btn ${fromTo === "to" ? "" : "btn-outline"}`}
          href={createLinkWithParams({
            notificationId: "",
            page: "0",
            fromTo: "to",
          })}
        >
          {t("notification.to")}
        </Link>
        <Link
          className={`btn-primary btn ${
            fromTo === "from" ? "" : "btn-outline"
          }`}
          href={createLinkWithParams({
            notificationId: "",
            page: "0",
            fromTo: "from",
          })}
        >
          {t("notification.from")}
        </Link>
      </div>
      <ul className="menu w-full overflow-hidden rounded bg-base-100">
        {notifications.map((notification) => (
          <li key={notification._id}>
            <Link
              href={createLinkWithParams({
                notificationId: notification._id,
                page: page.toString(),
                fromTo,
              })}
              className={twMerge(
                "flex items-center justify-between",
                notificationId === notification._id &&
                  "border border-primary bg-primary/10",
                !notification.viewedAt && "font-bold",
              )}
            >
              <div>
                {formatDateLocalized(new Date(notification.createdAt), {
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
                {notification.answeredAt ? (
                  <i className="bx bx-check bx-xs rounded-full bg-success p-2 text-success-content" />
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination
        actualPage={page}
        count={total}
        onPageClick={(newPage) => {
          router.push(
            createLinkWithParams({
              notificationId: "",
              page: newPage.toString(),
              fromTo,
            }),
          );
        }}
        perPage={PER_PAGE}
      />
    </div>
  );
}
